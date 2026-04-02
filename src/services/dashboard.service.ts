import prisma from '../config/database';

/**
 * Dashboard analytics service.
 * 
 * Provides aggregated financial data for dashboard views.
 * 
 * Design decision: These queries are designed to be efficient even
 * with larger datasets. We use Prisma's aggregate/groupBy where possible,
 * and raw SQL for complex aggregations that Prisma's API can't express cleanly.
 * 
 * In a production system, these could be backed by materialized views
 * or a caching layer for performance.
 */

export class DashboardService {
  /**
   * Get financial overview: total income, expenses, net balance, record count.
   */
  async getOverview() {
    const [incomeResult, expenseResult, recordCount] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { type: 'INCOME', deletedAt: null },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.financialRecord.aggregate({
        where: { type: 'EXPENSE', deletedAt: null },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.financialRecord.count({
        where: { deletedAt: null },
      }),
    ]);

    const totalIncome = incomeResult._sum.amount || 0;
    const totalExpenses = expenseResult._sum.amount || 0;

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netBalance: Math.round((totalIncome - totalExpenses) * 100) / 100,
      totalRecords: recordCount,
      incomeCount: incomeResult._count,
      expenseCount: expenseResult._count,
    };
  }

  /**
   * Get income and expense totals broken down by category.
   */
  async getCategoryBreakdown() {
    const categories = await prisma.financialRecord.groupBy({
      by: ['category', 'type'],
      where: { deletedAt: null },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    // Organize into a more useful structure
    const breakdown: Record<string, { income: number; expense: number; net: number; count: number }> = {};

    for (const cat of categories) {
      if (!breakdown[cat.category]) {
        breakdown[cat.category] = { income: 0, expense: 0, net: 0, count: 0 };
      }

      const amount = Math.round((cat._sum.amount || 0) * 100) / 100;
      breakdown[cat.category].count += cat._count;

      if (cat.type === 'INCOME') {
        breakdown[cat.category].income = amount;
      } else {
        breakdown[cat.category].expense = amount;
      }
    }

    // Calculate net for each category
    for (const cat of Object.values(breakdown)) {
      cat.net = Math.round((cat.income - cat.expense) * 100) / 100;
    }

    return Object.entries(breakdown).map(([category, data]) => ({
      category,
      ...data,
    }));
  }

  /**
   * Get monthly trends over the last N months.
   * Returns time-series data suitable for charting.
   */
  async getMonthlyTrends(months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const records = await prisma.financialRecord.findMany({
      where: {
        deletedAt: null,
        date: { gte: startDate },
      },
      select: {
        amount: true,
        type: true,
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group by month
    const monthlyData: Record<string, { income: number; expense: number; count: number }> = {};

    // Initialize all months with zeros
    for (let i = 0; i < months; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { income: 0, expense: 0, count: 0 };
    }

    // Accumulate amounts
    for (const record of records) {
      const date = new Date(record.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyData[key]) {
        monthlyData[key].count++;
        if (record.type === 'INCOME') {
          monthlyData[key].income += record.amount;
        } else {
          monthlyData[key].expense += record.amount;
        }
      }
    }

    // Convert to sorted array
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        income: Math.round(data.income * 100) / 100,
        expense: Math.round(data.expense * 100) / 100,
        net: Math.round((data.income - data.expense) * 100) / 100,
        count: data.count,
      }));
  }

  /**
   * Get recent activity — latest N transactions.
   */
  async getRecentActivity(limit: number = 10) {
    return prisma.financialRecord.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        amount: true,
        type: true,
        category: true,
        description: true,
        date: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get top categories by spending/income.
   */
  async getTopCategories(limit: number = 5, type?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { deletedAt: null };
    if (type) where.type = type;

    const categories = await prisma.financialRecord.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    return categories.map((cat: any) => ({
      category: cat.category,
      total: Math.round((cat._sum.amount || 0) * 100) / 100,
      count: cat._count,
    }));
  }
}

export const dashboardService = new DashboardService();
