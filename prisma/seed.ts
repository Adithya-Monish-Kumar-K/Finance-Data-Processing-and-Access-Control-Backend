import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Database seed script.
 * 
 * Creates sample users (one per role) and 50 realistic financial records.
 * Run with: npm run seed
 * 
 * Pre-seeded credentials:
 *   Admin:   admin@example.com   / Admin123!
 *   Analyst: analyst@example.com / Analyst123!
 *   Viewer:  viewer@example.com  / Viewer123!
 */

const prisma = new PrismaClient();

const CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Food & Dining',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Rent',
  'Insurance',
];

const DESCRIPTIONS: Record<string, string[]> = {
  'Salary': ['Monthly salary', 'Quarterly bonus', 'Year-end bonus'],
  'Freelance': ['Web development project', 'Consulting fee', 'Design work'],
  'Investments': ['Stock dividends', 'Bond interest', 'Mutual fund returns'],
  'Food & Dining': ['Grocery shopping', 'Restaurant dinner', 'Coffee subscription', 'Lunch at work'],
  'Utilities': ['Electricity bill', 'Water bill', 'Internet subscription', 'Phone bill'],
  'Transportation': ['Gas/fuel', 'Public transit pass', 'Uber rides', 'Car maintenance'],
  'Entertainment': ['Movie tickets', 'Streaming subscription', 'Concert tickets', 'Video games'],
  'Healthcare': ['Doctor visit', 'Pharmacy', 'Gym membership', 'Dental checkup'],
  'Shopping': ['Clothing', 'Electronics', 'Home supplies', 'Gifts'],
  'Education': ['Online course', 'Books', 'Workshop fee', 'Certification exam'],
  'Rent': ['Monthly rent', 'Security deposit'],
  'Insurance': ['Health insurance', 'Car insurance', 'Life insurance'],
};

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDate(monthsBack: number): Date {
  const now = new Date();
  const past = new Date();
  past.setMonth(past.getMonth() - monthsBack);
  const timestamp = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(timestamp);
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clean existing data
  await prisma.refreshToken.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const analystPassword = await bcrypt.hash('Analyst123!', 12);
  const analyst = await prisma.user.create({
    data: {
      email: 'analyst@example.com',
      password: analystPassword,
      firstName: 'Bob',
      lastName: 'Analyst',
      role: 'ANALYST',
      status: 'ACTIVE',
    },
  });

  const viewerPassword = await bcrypt.hash('Viewer123!', 12);
  await prisma.user.create({
    data: {
      email: 'viewer@example.com',
      password: viewerPassword,
      firstName: 'Carol',
      lastName: 'Viewer',
      role: 'VIEWER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created 3 users:');
  console.log('   admin@example.com   / Admin123!   (ADMIN)');
  console.log('   analyst@example.com / Analyst123!  (ANALYST)');
  console.log('   viewer@example.com  / Viewer123!   (VIEWER)\n');

  // Create financial records
  const records = [];
  const users = [admin, analyst];

  for (let i = 0; i < 50; i++) {
    const isIncome = Math.random() < 0.35; // ~35% income, ~65% expense (realistic)
    const type = isIncome ? 'INCOME' : 'EXPENSE';

    const incomeCategories = ['Salary', 'Freelance', 'Investments'];
    const expenseCategories = CATEGORIES.filter((c) => !incomeCategories.includes(c));
    const category = isIncome ? randomPick(incomeCategories) : randomPick(expenseCategories);

    const amount = isIncome
      ? randomAmount(1000, 15000) // Income: larger amounts
      : randomAmount(10, 3000);  // Expenses: smaller amounts

    records.push({
      amount,
      type,
      category,
      description: randomPick(DESCRIPTIONS[category] || ['Miscellaneous']),
      date: randomDate(12), // Last 12 months
      userId: randomPick(users).id,
    });
  }

  await prisma.financialRecord.createMany({ data: records });

  console.log(`✅ Created ${records.length} financial records across ${CATEGORIES.length} categories`);

  // Print summary
  const incomeTotal = records
    .filter((r) => r.type === 'INCOME')
    .reduce((sum, r) => sum + r.amount, 0);
  const expenseTotal = records
    .filter((r) => r.type === 'EXPENSE')
    .reduce((sum, r) => sum + r.amount, 0);

  console.log(`\n📊 Summary:`);
  console.log(`   Income records:  ${records.filter((r) => r.type === 'INCOME').length}`);
  console.log(`   Expense records: ${records.filter((r) => r.type === 'EXPENSE').length}`);
  console.log(`   Total income:    $${incomeTotal.toFixed(2)}`);
  console.log(`   Total expenses:  $${expenseTotal.toFixed(2)}`);
  console.log(`   Net balance:     $${(incomeTotal - expenseTotal).toFixed(2)}`);
  console.log('\n🎉 Seed complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
