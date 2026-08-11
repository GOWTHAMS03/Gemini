-- V3__add_sales_return_and_ledgers.sql
-- Schema additions for Bread Return, Credit Notes, Replacement Billing, and Audit Ledgers

-- 1. Create Sales Returns Table
CREATE TABLE IF NOT EXISTS sales_returns (
    id BIGSERIAL PRIMARY KEY,
    return_number VARCHAR(50) NOT NULL UNIQUE,
    original_invoice_id BIGINT NOT NULL REFERENCES invoices(id),
    replacement_invoice_id BIGINT REFERENCES invoices(id),
    shop_id BIGINT NOT NULL REFERENCES shops(id),
    driver_id BIGINT REFERENCES users(id),
    trip_id BIGINT REFERENCES trips(id),
    subtotal NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    total_return_amount NUMERIC(12,2) NOT NULL,
    reason VARCHAR(100),
    return_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Sales Return Items Table
CREATE TABLE IF NOT EXISTS sales_return_items (
    id BIGSERIAL PRIMARY KEY,
    sales_return_id BIGINT NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
    original_invoice_item_id BIGINT NOT NULL REFERENCES invoice_items(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    returned_quantity INT NOT NULL,
    original_unit_price NUMERIC(10,2) NOT NULL,
    total_credit_amount NUMERIC(12,2) NOT NULL
);

-- 3. Create Credit Notes Table
CREATE TABLE IF NOT EXISTS credit_notes (
    id BIGSERIAL PRIMARY KEY,
    credit_note_number VARCHAR(50) NOT NULL UNIQUE,
    sales_return_id BIGINT NOT NULL UNIQUE REFERENCES sales_returns(id) ON DELETE CASCADE,
    shop_id BIGINT NOT NULL REFERENCES shops(id),
    total_amount NUMERIC(12,2) NOT NULL,
    applied_amount NUMERIC(12,2) DEFAULT 0,
    remaining_amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ISSUED', -- ISSUED, PARTIALLY_APPLIED, FULLY_APPLIED, CANCELLED
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Shop Ledger Table
CREATE TABLE IF NOT EXISTS shop_ledger (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id),
    transaction_type VARCHAR(50) NOT NULL, -- INVOICE, RETURN, CREDIT_NOTE_ISSUED, CREDIT_NOTE_APPLIED, PAYMENT, ADJUSTMENT
    reference_number VARCHAR(100),
    debit_amount NUMERIC(12,2) DEFAULT 0,
    credit_amount NUMERIC(12,2) DEFAULT 0,
    running_balance NUMERIC(12,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Product Stock Ledger Table
CREATE TABLE IF NOT EXISTS product_stock_ledger (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    warehouse_id BIGINT REFERENCES warehouses(id),
    trip_id BIGINT REFERENCES trips(id),
    shop_id BIGINT REFERENCES shops(id),
    movement_type VARCHAR(50) NOT NULL, -- PRODUCTION, TRIP_LOAD, SALE, RETURN_EXPIRED, RETURN_DAMAGED, ADJUSTMENT
    quantity INT NOT NULL,
    reference_number VARCHAR(100),
    batch_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Expired Product Tracking Table
CREATE TABLE IF NOT EXISTS expired_product_tracking (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    sales_return_id BIGINT REFERENCES sales_returns(id),
    quantity INT NOT NULL,
    original_unit_price NUMERIC(10,2) NOT NULL,
    total_loss_value NUMERIC(12,2) NOT NULL,
    disposal_status VARCHAR(50) NOT NULL DEFAULT 'COLLECTED_BY_DRIVER', -- COLLECTED_BY_DRIVER, RETURNED_TO_FACTORY, DISPOSED, RECYCLED
    mfg_date DATE,
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Add Return / Replacement Columns to Invoices & Invoice Items
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS return_credit_applied NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS net_payable_amount NUMERIC(12,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS credit_note_id BIGINT REFERENCES credit_notes(id);

ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS returned_quantity INT DEFAULT 0;
