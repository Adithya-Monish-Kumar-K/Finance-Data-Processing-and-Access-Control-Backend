import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../errors/AppError';
import { CreateUserInput, UpdateUserInput } from '../validators/user.validator';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';

/**
 * User management service.
 * 
 * Handles CRUD operations for users, role assignment, and status management.
 * All queries exclude soft-deleted users by default.
 */

const SALT_ROUNDS = 12;

// Fields to return (never expose password hash)
const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export class UserService {
  /**
   * Get paginated list of users with optional filters.
   */
  async getUsers(query: {
    page?: string;
    limit?: string;
    role?: string;
    status?: string;
    search?: string;
  }) {
    const { page, limit, skip } = parsePagination(query);

    // Build dynamic filter
    const where: Record<string, unknown> = {
      deletedAt: null, // Exclude soft-deleted
    };

    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: buildPaginationMeta(page, limit, total),
    };
  }

  /**
   * Get a single user by ID.
   */
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Create a new user (admin action).
   */
  async createUser(data: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    return prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: userSelect,
    });
  }

  /**
   * Update user profile.
   */
  async updateUser(id: string, data: UpdateUserInput) {
    await this.ensureUserExists(id);

    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (existing) {
        throw new ConflictError('Email is already in use');
      }
    }

    return prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }

  /**
   * Update user's role.
   */
  async updateRole(id: string, role: string) {
    await this.ensureUserExists(id);

    return prisma.user.update({
      where: { id },
      data: { role },
      select: userSelect,
    });
  }

  /**
   * Toggle user status (active/inactive).
   */
  async updateStatus(id: string, status: string) {
    await this.ensureUserExists(id);

    return prisma.user.update({
      where: { id },
      data: { status },
      select: userSelect,
    });
  }

  /**
   * Soft delete a user.
   * 
   * Design decision: Soft delete preserves audit trail and allows
   * recovery. The user's financial records remain intact.
   */
  async deleteUser(id: string) {
    await this.ensureUserExists(id);

    // Also revoke all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: id } });

    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
      select: userSelect,
    });
  }

  private async ensureUserExists(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundError('User');
    }

    return user;
  }
}

export const userService = new UserService();
