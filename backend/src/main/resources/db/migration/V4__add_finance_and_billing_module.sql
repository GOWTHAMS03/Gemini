-- V4__add_finance_and_billing_module.sql
-- Schema for Finance and Billing Management Module (Purchases, Returns, Expenses, Cash/Bank, General Ledger)

-- 1. Create Purchase Invoices Table
CREATE TABLE IF NOT EXISTS purchase_invoices (
    id BIGSERIAL PRIMARY KEY,
    purchase_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    invoice_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    subtotal NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    freight_charges NUMERIC(12,2) DEFAULT 0,
    additional_charges NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL,
    paid_amount NUMERIC(12,2) DEFAULT 0,
    outstanding_amount NUMERIC(12,2) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PAID, PENDING, PARTIAL
    payment_mode VARCHAR(30), -- CASH, BANK_TRANSFER, UPI, CHEQUE, CREDIT
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Purchase Invoice Items Table
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_invoice_id BIGINT NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    raw_material_id BIGINT NOT NULL REFERENCES raw_materials(id),
    quantity NUMERIC(12,3) NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL,
    total_cost NUMERIC(12,2) NOT NULL,
    returned_quantity NUMERIC(12,3) DEFAULT 0
);

-- 3. Create Purchase Returns Table
CREATE TABLE IF NOT EXISTS purchase_returns (
    id BIGSERIAL PRIMARY KEY,
    return_number VARCHAR(50) NOT NULL UNIQUE,
    purchase_invoice_id BIGINT NOT NULL REFERENCES purchase_invoices(id),
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    subtotal NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    total_return_amount NUMERIC(12,2) NOT NULL,
    reason VARCHAR(100),
    return_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Purchase Return Items Table
CREATE TABLE IF NOT EXISTS purchase_return_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_return_id BIGINT NOT NULL REFERENCES purchase_returns(id) ON DELETE CASCADE,
    purchase_invoice_item_id BIGINT NOT NULL REFERENCES purchase_invoice_items(id),
    raw_material_id BIGINT NOT NULL REFERENCES raw_materials(id),
    returned_quantity NUMERIC(12,3) NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL,
    total_credit_amount NUMERIC(12,2) NOT NULL
);

-- 5. Create Supplier Ledger Table
CREATE TABLE IF NOT EXISTS supplier_ledger (
    id BIGSERIAL PRIMARY KEY,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    transaction_type VARCHAR(50) NOT NULL, -- PURCHASE_INVOICE, PAYMENT_MADE, PURCHASE_RETURN, ADJUSTMENT
    reference_number VARCHAR(100),
    debit_amount NUMERIC(12,2) DEFAULT 0,
    credit_amount NUMERIC(12,2) DEFAULT 0,
    running_balance NUMERIC(12,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id BIGSERIAL PRIMARY KEY,
    expense_number VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- SALARIES, FUEL, VEHICLE_MAINTENANCE, ELECTRICITY, RENT, OFFICE, PACKAGING, MISCELLANEOUS
    subtotal NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL,
    payment_mode VARCHAR(30) NOT NULL, -- CASH, BANK_TRANSFER, UPI, CHEQUE
    payee_name VARCHAR(150),
    expense_date DATE NOT NULL,
    reference_number VARCHAR(100),
    description TEXT,
    approved_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Cash & Bank Transactions Table
CREATE TABLE IF NOT EXISTS cash_bank_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_number VARCHAR(50) NOT NULL UNIQUE,
    account_type VARCHAR(20) NOT NULL, -- CASH, BANK
    transaction_type VARCHAR(30) NOT NULL, -- CASH_IN, CASH_OUT, BANK_DEPOSIT, BANK_WITHDRAWAL, TRANSFER
    amount NUMERIC(12,2) NOT NULL,
    reference_type VARCHAR(50), -- SALES_INVOICE, PURCHASE_INVOICE, EXPENSE, CUSTOMER_PAYMENT, SUPPLIER_PAYMENT, OTHER_INCOME
    reference_number VARCHAR(100),
    running_cash_balance NUMERIC(12,2),
    running_bank_balance NUMERIC(12,2),
    reconciliation_status VARCHAR(30) DEFAULT 'RECONCILED', -- PENDING, RECONCILED
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create Daily Cash Closings Table
CREATE TABLE IF NOT EXISTS daily_cash_closings (
    id BIGSERIAL PRIMARY KEY,
    closing_date DATE NOT NULL UNIQUE,
    opening_balance NUMERIC(12,2) NOT NULL,
    total_cash_in NUMERIC(12,2) NOT NULL,
    total_cash_out NUMERIC(12,2) NOT NULL,
    expected_cash_balance NUMERIC(12,2) NOT NULL,
    actual_cash_counted NUMERIC(12,2) NOT NULL,
    discrepancy_amount NUMERIC(12,2) DEFAULT 0,
    closed_by_user_id BIGINT REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create Chart of Accounts Table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id BIGSERIAL PRIMARY KEY,
    account_code VARCHAR(30) NOT NULL UNIQUE,
    account_name VARCHAR(150) NOT NULL,
    account_type VARCHAR(30) NOT NULL, -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    is_active BOOLEAN DEFAULT TRUE
);

-- 10. Create Journal Entries & Lines Tables
CREATE TABLE IF NOT EXISTS journal_entries (
    id BIGSERIAL PRIMARY KEY,
    entry_number VARCHAR(50) NOT NULL UNIQUE,
    entry_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reference_type VARCHAR(50),
    reference_number VARCHAR(100),
    description TEXT,
    total_debit NUMERIC(12,2) NOT NULL,
    total_credit NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id BIGSERIAL PRIMARY KEY,
    journal_entry_id BIGINT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_code VARCHAR(30) NOT NULL,
    debit_amount NUMERIC(12,2) DEFAULT 0,
    credit_amount NUMERIC(12,2) DEFAULT 0,
    memo TEXT
);

-- 11. Add Outstanding Balance to Suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(12,2) DEFAULT 0;

-- 12. Seed Default Chart of Accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type) VALUES
('1000', 'Cash on Hand', 'ASSET'),
('1100', 'Bank Account', 'ASSET'),
('1200', 'Accounts Receivable (Shops)', 'ASSET'),
('1300', 'Raw Material Inventory', 'ASSET'),
('1400', 'Finished Goods Inventory', 'ASSET'),
('2000', 'Accounts Payable (Suppliers)', 'LIABILITY'),
('2100', 'GST Payable', 'LIABILITY'),
('3000', 'Owners Capital', 'EQUITY'),
('4000', 'Sales Revenue', 'REVENUE'),
('4100', 'Other Income', 'REVENUE'),
('5000', 'Cost of Goods Sold', 'EXPENSE'),
('5100', 'Salaries & Wages', 'EXPENSE'),
('5200', 'Fuel & Logistics', 'EXPENSE'),
('5300', 'Vehicle Maintenance', 'EXPENSE'),
('5400', 'Electricity & Utilities', 'EXPENSE'),
('5500', 'Rent Expense', 'EXPENSE'),
('5600', 'Packaging Expense', 'EXPENSE'),
('5700', 'General & Admin Expense', 'EXPENSE')
ON CONFLICT (account_code) DO NOTHING;
