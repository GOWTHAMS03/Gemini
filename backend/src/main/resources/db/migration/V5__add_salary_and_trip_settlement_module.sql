-- V5__add_salary_and_trip_settlement_module.sql
-- Schema for Employee Salary Management, Trip Beta, Truck Inventory Tracking, and EOD Settlement

-- 1. Create Employee Salaries Table
CREATE TABLE IF NOT EXISTS employee_salaries (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    salary_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM (e.g., '2026-08')
    basic_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
    allowance_amount NUMERIC(12,2) DEFAULT 0,
    deduction_amount NUMERIC(12,2) DEFAULT 0,
    trip_beta_amount NUMERIC(12,2) DEFAULT 0,
    other_expenses NUMERIC(12,2) DEFAULT 0,
    net_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSED, PAID, CANCELLED
    payment_date DATE,
    payment_mode VARCHAR(30), -- CASH, BANK_TRANSFER, UPI, CHEQUE
    expense_id BIGINT REFERENCES expenses(id) ON DELETE SET NULL,
    notes TEXT,
    processed_by VARCHAR(100),
    paid_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_employee_salary_month UNIQUE (employee_id, salary_month)
);

CREATE INDEX IF NOT EXISTS idx_employee_salaries_month ON employee_salaries(salary_month);
CREATE INDEX IF NOT EXISTS idx_employee_salaries_status ON employee_salaries(status);

-- 2. Enhance Trips Table for Trip Beta, Financial Tracking, and EOD Settlement
ALTER TABLE trips ADD COLUMN IF NOT EXISTS beta_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS beta_payment_status VARCHAR(30) DEFAULT 'PENDING'; -- PENDING, PAID
ALTER TABLE trips ADD COLUMN IF NOT EXISTS beta_payment_mode VARCHAR(30); -- CASH, BANK_TRANSFER, UPI, CHEQUE
ALTER TABLE trips ADD COLUMN IF NOT EXISTS beta_paid_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS beta_expense_id BIGINT REFERENCES expenses(id) ON DELETE SET NULL;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS beta_notes TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS other_trip_expenses NUMERIC(12,2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS other_expenses_notes TEXT;

ALTER TABLE trips ADD COLUMN IF NOT EXISTS total_sales_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cash_collected NUMERIC(12,2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS upi_collected NUMERIC(12,2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS total_collected NUMERIC(12,2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS collection_variance NUMERIC(12,2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS inventory_variance INTEGER DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS settlement_status VARCHAR(30) DEFAULT 'PENDING'; -- PENDING, SETTLED, DISCREPANCY

ALTER TABLE trips ADD COLUMN IF NOT EXISTS eod_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS eod_submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS eod_notes TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS settled_by VARCHAR(100);

-- 3. Register Chart of Accounts for Trip Beta and Trip Incidentals
INSERT INTO chart_of_accounts (account_code, account_name, account_type) VALUES
('5250', 'Trip Beta & Driver Allowances', 'EXPENSE'),
('5260', 'Trip Incidentals & Expenses', 'EXPENSE')
ON CONFLICT (account_code) DO NOTHING;
