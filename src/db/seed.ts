import { PrismaClient, Role, Status, FinancialType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

const seedUsers = [
  {
    email: 'admin@finance.com',
    password: 'admin123',
    name: 'Admin User',
    role: Role.admin,
    status: Status.active,
  },
  {
    email: 'analyst@finance.com',
    password: 'analyst123',
    name: 'Analyst User',
    role: Role.analyst,
    status: Status.active,
  },
  {
    email: 'viewer@finance.com',
    password: 'viewer123',
    name: 'Viewer User',
    role: Role.viewer,
    status: Status.active,
  },
];

const categories = ['Salary', 'Freelance', 'Investments', 'Rent', 'Utilities', 'Food', 'Transport', 'Entertainment', 'Healthcare', 'Education'];

const generateRecords = (adminId: string) => {
  const records = [];
  const now = new Date();

  for (let i = 0; i < 20; i++) {
    const isIncome = i % 3 === 0;
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 180)); // Random date within last 6 months

    records.push({
      amount: parseFloat((Math.random() * 5000 + 100).toFixed(2)),
      type: isIncome ? FinancialType.income : FinancialType.expense,
      category: categories[Math.floor(Math.random() * categories.length)],
      date,
      notes: isIncome
        ? `Income record #${i + 1} — ${['Monthly salary', 'Project payment', 'Dividend payout', 'Consulting fee'][Math.floor(Math.random() * 4)]}`
        : `Expense record #${i + 1} — ${['Monthly bill', 'Office supplies', 'Team lunch', 'Subscription renewal'][Math.floor(Math.random() * 4)]}`,
      isDeleted: false,
      createdBy: adminId,
    });
  }

  return records;
};

const seed = async (): Promise<void> => {
  console.log('🌱 Starting seed...\n');

  // Clear existing data
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();
  console.log('   Cleared existing data');

  // Create users
  const createdUsers = [];
  for (const userData of seedUsers) {
    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        name: userData.name,
        role: userData.role,
        status: userData.status,
      },
    });
    createdUsers.push(user);
    console.log(`   ✅ Created ${userData.role}: ${userData.email} (password: ${userData.password})`);
  }

  // Create financial records
  const adminUser = createdUsers.find((u) => u.role === 'admin')!;
  const records = generateRecords(adminUser.id);

  await prisma.financialRecord.createMany({
    data: records,
  });

  console.log(`   ✅ Created ${records.length} financial records\n`);
  console.log('🎉 Seed completed successfully!');
  console.log('\n--- Login Credentials ---');
  for (const user of seedUsers) {
    console.log(`   ${user.role.padEnd(8)} → ${user.email} / ${user.password}`);
  }
};

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
