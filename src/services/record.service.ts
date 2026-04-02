import prisma from '../config/database';
import { NotFoundError } from '../errors/AppError';
import { CreateRecordInput, UpdateRecordInput } from '../validators/record.validator';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';

/**
 * Financial records service.
 * 
 * Handles CRUD operations with filtering, sorting, pagination, and search.
 * All queries exclude soft-deleted records.
 */

const recordSelect = {
  id: true,
  amount: true,
  type: true,
  category: true,
  description: true,
  date: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
};

export class RecordService {
  /**
   * Get paginated, filtered, sorted records.
   */
  async getRecords(query: {
    page?: string;
    limit?: string;
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const { page, limit, skip } = parsePagination(query);

    // Build dynamic filter using AND array for clean composition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [
      { deletedAt: null },
    ];

    if (query.type) {
      conditions.push({ type: query.type });
    }

    if (query.category) {
      conditions.push({ category: { contains: query.category } });
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dateFilter: any = {};
      if (query.startDate) dateFilter.gte = new Date(query.startDate);
      if (query.endDate) dateFilter.lte = new Date(query.endDate);
      conditions.push({ date: dateFilter });
    }

    // Search across category and description
    if (query.search) {
      conditions.push({
        OR: [
          { category: { contains: query.search } },
          { description: { contains: query.search } },
        ],
      });
    }

    const where = { AND: conditions };
    const sortBy = query.sortBy || 'date';
    const sortOrder = query.sortOrder || 'desc';

    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        select: recordSelect,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.financialRecord.count({ where }),
    ]);

    return {
      records,
      pagination: buildPaginationMeta(page, limit, total),
    };
  }

  /**
   * Get a single record by ID.
   */
  async getRecordById(id: string) {
    const record = await prisma.financialRecord.findFirst({
      where: { id, deletedAt: null },
      select: recordSelect,
    });

    if (!record) {
      throw new NotFoundError('Financial record');
    }

    return record;
  }

  /**
   * Create a new financial record.
   */
  async createRecord(data: CreateRecordInput, userId: string) {
    return prisma.financialRecord.create({
      data: {
        amount: data.amount,
        type: data.type,
        category: data.category,
        description: data.description || null,
        date: data.date,
        userId,
      },
      select: recordSelect,
    });
  }

  /**
   * Update an existing record.
   */
  async updateRecord(id: string, data: UpdateRecordInput) {
    await this.ensureRecordExists(id);

    return prisma.financialRecord.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date !== undefined && { date: data.date }),
      },
      select: recordSelect,
    });
  }

  /**
   * Soft delete a financial record.
   */
  async deleteRecord(id: string) {
    await this.ensureRecordExists(id);

    return prisma.financialRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }

  private async ensureRecordExists(id: string) {
    const record = await prisma.financialRecord.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!record || record.deletedAt) {
      throw new NotFoundError('Financial record');
    }

    return record;
  }
}

export const recordService = new RecordService();
