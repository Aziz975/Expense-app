-- Sample Data for Expense Tracker
-- Password for all users: Password@123
-- Run after schema.sql

USE expense_tracker;

-- Admin user (email: admin@expense.com)
-- Regular user (email: john@example.com)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@expense.com', '$2a$10$rQZ5K8YvH5xGxGxGxGxGxO8xGxGxGxGxGxGxGxGxGxGxGxGxGxGxG', 'admin'),
('John Doe', 'john@example.com', '$2a$10$rQZ5K8YvH5xGxGxGxGxGxO8xGxGxGxGxGxGxGxGxGxGxGxGxGxGxG', 'user'),
('Jane Smith', 'jane@example.com', '$2a$10$rQZ5K8YvH5xGxGxGxGxGxO8xGxGxGxGxGxGxGxGxGxGxGxGxGxGxG', 'user');

-- Note: The password hashes above are placeholders.
-- After starting the server, register users via API or use the seed script in backend.

-- Sample income for user 2 (John)
INSERT INTO income (user_id, amount, source, description, date) VALUES
(2, 5000.00, 'Salary', 'Monthly salary', '2026-06-01'),
(2, 800.00, 'Freelance', 'Web development project', '2026-06-10'),
(2, 200.00, 'Investment', 'Dividend payment', '2026-06-15'),
(2, 5000.00, 'Salary', 'Monthly salary', '2026-05-01'),
(2, 1500.00, 'Bonus', 'Performance bonus', '2026-05-20');

-- Sample expenses for user 2 (John)
INSERT INTO expenses (user_id, amount, category, description, date) VALUES
(2, 450.00, 'Food', 'Grocery shopping', '2026-06-02'),
(2, 120.00, 'Travel', 'Uber rides', '2026-06-03'),
(2, 89.99, 'Shopping', 'New shoes', '2026-06-05'),
(2, 150.00, 'Bills', 'Electricity bill', '2026-06-08'),
(2, 75.00, 'Health', 'Pharmacy', '2026-06-12'),
(2, 200.00, 'Education', 'Online course', '2026-06-14'),
(2, 50.00, 'Entertainment', 'Movie tickets', '2026-06-16'),
(2, 35.00, 'Other', 'Miscellaneous', '2026-06-17'),
(2, 380.00, 'Food', 'Restaurant dining', '2026-05-10'),
(2, 200.00, 'Travel', 'Train ticket', '2026-05-15'),
(2, 120.00, 'Bills', 'Internet bill', '2026-05-20');

-- Sample budgets for user 2 (John)
INSERT INTO budgets (user_id, category, budget_amount, month) VALUES
(2, 'Food', 600.00, '2026-06'),
(2, 'Travel', 200.00, '2026-06'),
(2, 'Shopping', 300.00, '2026-06'),
(2, 'Bills', 250.00, '2026-06'),
(2, 'Entertainment', 100.00, '2026-06');
