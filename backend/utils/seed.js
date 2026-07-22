/**
 * Database seed script - creates admin and sample user with hashed passwords
 * Run: npm run seed
 * Default password for all seeded users: Password@123
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const seed = async () => {
  try {
    const password = 'Password@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const [adminExists] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      ['admin@expense.com']
    );

    let adminId;
    if (adminExists.length === 0) {
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@expense.com', hashedPassword, 'admin']
      );
      adminId = result.insertId;
      console.log('Admin user created: admin@expense.com');
    } else {
      adminId = adminExists[0].id;
      console.log('Admin user already exists.');
    }

    // Create sample user
    const [userExists] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      ['john@example.com']
    );

    let userId;
    if (userExists.length === 0) {
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['John Doe', 'john@example.com', hashedPassword, 'user']
      );
      userId = result.insertId;
      console.log('Sample user created: john@example.com');
    } else {
      userId = userExists[0].id;
      console.log('Sample user already exists.');
    }

    // Seed sample income
    const [incomeCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM income WHERE user_id = ?',
      [userId]
    );
    if (incomeCount[0].count === 0) {
      await pool.execute(
        `INSERT INTO income (user_id, amount, source, description, date) VALUES
         (?, 5000, 'Salary', 'Monthly salary', '2026-06-01'),
         (?, 800, 'Freelance', 'Web development project', '2026-06-10'),
         (?, 200, 'Investment', 'Dividend payment', '2026-06-15'),
         (?, 5000, 'Salary', 'Monthly salary', '2026-05-01')`,
        [userId, userId, userId, userId]
      );
      console.log('Sample income data seeded.');
    }

    // Seed sample expenses
    const [expenseCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM expenses WHERE user_id = ?',
      [userId]
    );
    if (expenseCount[0].count === 0) {
      await pool.execute(
        `INSERT INTO expenses (user_id, amount, category, description, date) VALUES
         (?, 450, 'Food', 'Grocery shopping', '2026-06-02'),
         (?, 120, 'Travel', 'Uber rides', '2026-06-03'),
         (?, 89.99, 'Shopping', 'New shoes', '2026-06-05'),
         (?, 150, 'Bills', 'Electricity bill', '2026-06-08'),
         (?, 75, 'Health', 'Pharmacy', '2026-06-12'),
         (?, 200, 'Education', 'Online course', '2026-06-14'),
         (?, 50, 'Entertainment', 'Movie tickets', '2026-06-16'),
         (?, 35, 'Other', 'Miscellaneous', '2026-06-17')`,
        [userId, userId, userId, userId, userId, userId, userId, userId]
      );
      console.log('Sample expense data seeded.');
    }

    // Seed sample budgets
    const [budgetCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM budgets WHERE user_id = ?',
      [userId]
    );
    if (budgetCount[0].count === 0) {
      await pool.execute(
        `INSERT INTO budgets (user_id, category, budget_amount, month) VALUES
         (?, 'Food', 600, '2026-06'),
         (?, 'Travel', 200, '2026-06'),
         (?, 'Shopping', 300, '2026-06'),
         (?, 'Bills', 250, '2026-06'),
         (?, 'Entertainment', 100, '2026-06')`,
        [userId, userId, userId, userId, userId]
      );
      console.log('Sample budget data seeded.');
    }

    console.log('\nSeed completed successfully!');
    console.log('Login credentials:');
    console.log('  Admin: admin@expense.com / Password@123');
    console.log('  User:  john@example.com / Password@123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
