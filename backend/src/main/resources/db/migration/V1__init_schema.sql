-- PostgreSQL Schema for Enterprise B2B Bread Factory ERP System

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(30) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- User Roles Junction
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY,
    supplier_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(150),
    gstin VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Raw Materials Table
CREATE TABLE IF NOT EXISTS raw_materials (
    id BIGSERIAL PRIMARY KEY,
    material_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50),
    unit VARCHAR(20) NOT NULL, -- KG, LTR, PACKET, BOX
    current_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
    min_stock_alert NUMERIC(12,3) NOT NULL DEFAULT 0,
    max_stock_capacity NUMERIC(12,3),
    unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    supplier_id BIGINT REFERENCES suppliers(id),
    warehouse_location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    qr_code VARCHAR(100) UNIQUE,
    weight_grams NUMERIC(8,2),
    mrp NUMERIC(10,2) NOT NULL,
    dealer_price NUMERIC(10,2) NOT NULL,
    wholesale_price NUMERIC(10,2) NOT NULL,
    retail_price NUMERIC(10,2) NOT NULL,
    category VARCHAR(50),
    shelf_life_days INT NOT NULL,
    expiry_alert_days INT DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- BOM Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_output_quantity NUMERIC(10,2) NOT NULL DEFAULT 100, -- Output units produced per recipe run
    recipe_name VARCHAR(150) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recipe Items Table
CREATE TABLE IF NOT EXISTS recipe_items (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    raw_material_id BIGINT NOT NULL REFERENCES raw_materials(id),
    required_quantity NUMERIC(12,3) NOT NULL,
    unit VARCHAR(20) NOT NULL
);

-- Warehouses Table
CREATE TABLE IF NOT EXISTS warehouses (
    id BIGSERIAL PRIMARY KEY,
    warehouse_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL, -- FACTORY, STORAGE, TRUCK
    location TEXT,
    manager_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Finished Goods Inventory Table
CREATE TABLE IF NOT EXISTS finished_goods_inventory (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    batch_number VARCHAR(100) NOT NULL,
    quantity_available INT NOT NULL DEFAULT 0,
    mfg_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(warehouse_id, product_id, batch_number)
);

-- Production Runs Table
CREATE TABLE IF NOT EXISTS production_runs (
    id BIGSERIAL PRIMARY KEY,
    run_number VARCHAR(50) NOT NULL UNIQUE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    planned_quantity INT NOT NULL,
    actual_produced_quantity INT DEFAULT 0,
    rejected_quantity INT DEFAULT 0,
    waste_quantity INT DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED', -- PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    machine_used VARCHAR(100),
    operator_id BIGINT REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    batch_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles & Fleet Table
CREATE TABLE IF NOT EXISTS vehicles (
    id BIGSERIAL PRIMARY KEY,
    vehicle_number VARCHAR(30) NOT NULL UNIQUE,
    model VARCHAR(100),
    capacity_kg NUMERIC(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    warehouse_id BIGINT REFERENCES warehouses(id) -- Virtual truck warehouse
);

-- Shops / Retailers Table
CREATE TABLE IF NOT EXISTS shops (
    id BIGSERIAL PRIMARY KEY,
    shop_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    gstin VARCHAR(50),
    address TEXT NOT NULL,
    route_name VARCHAR(100),
    credit_limit NUMERIC(12,2) DEFAULT 5000,
    outstanding_amount NUMERIC(12,2) DEFAULT 0,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trips / Dispatches Table
CREATE TABLE IF NOT EXISTS trips (
    id BIGSERIAL PRIMARY KEY,
    trip_number VARCHAR(50) NOT NULL UNIQUE,
    driver_id BIGINT NOT NULL REFERENCES users(id),
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id),
    route_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DISPATCHED', -- PLANNED, DISPATCHED, IN_PROGRESS, COMPLETED
    dispatch_time TIMESTAMP WITH TIME ZONE,
    return_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trip Items (Truck Stock Allocation)
CREATE TABLE IF NOT EXISTS trip_items (
    id BIGSERIAL PRIMARY KEY,
    trip_id BIGINT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    loaded_quantity INT NOT NULL,
    sold_quantity INT DEFAULT 0,
    returned_quantity INT DEFAULT 0,
    damaged_quantity INT DEFAULT 0
);

-- Deliveries Table
CREATE TABLE IF NOT EXISTS deliveries (
    id BIGSERIAL PRIMARY KEY,
    delivery_number VARCHAR(50) NOT NULL UNIQUE,
    trip_id BIGINT NOT NULL REFERENCES trips(id),
    shop_id BIGINT NOT NULL REFERENCES shops(id),
    driver_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, DELIVERED, REJECTED
    delivery_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Delivery Acknowledgements Table (Proof of Delivery)
CREATE TABLE IF NOT EXISTS delivery_acknowledgements (
    id BIGSERIAL PRIMARY KEY,
    delivery_id BIGINT NOT NULL UNIQUE REFERENCES deliveries(id) ON DELETE CASCADE,
    accepted_quantity INT NOT NULL,
    damaged_quantity INT DEFAULT 0,
    missing_quantity INT DEFAULT 0,
    digital_signature_url TEXT,
    photo_proof_url TEXT,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_by_shop_user_id BIGINT REFERENCES users(id)
);

-- Invoices & Sales Table
CREATE TABLE IF NOT EXISTS invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    trip_id BIGINT REFERENCES trips(id),
    shop_id BIGINT NOT NULL REFERENCES shops(id),
    driver_id BIGINT REFERENCES users(id),
    subtotal NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL,
    payment_mode VARCHAR(30) NOT NULL, -- CASH, UPI, CREDIT, CHEQUE
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PAID', -- PAID, PENDING, PARTIAL
    invoice_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL
);

-- Driver Daily Collection Table
CREATE TABLE IF NOT EXISTS driver_collections (
    id BIGSERIAL PRIMARY KEY,
    collection_code VARCHAR(50) NOT NULL UNIQUE,
    trip_id BIGINT NOT NULL REFERENCES trips(id),
    driver_id BIGINT NOT NULL REFERENCES users(id),
    cash_collected NUMERIC(12,2) DEFAULT 0,
    upi_collected NUMERIC(12,2) DEFAULT 0,
    cheque_collected NUMERIC(12,2) DEFAULT 0,
    expected_total NUMERIC(12,2) NOT NULL,
    actual_total NUMERIC(12,2) NOT NULL,
    shortage_excess NUMERIC(12,2) DEFAULT 0, -- Negative = Shortage, Positive = Excess
    settlement_status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, SETTLED, DISCREPANCY
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'ROLE_SUPER_ADMIN', 'Super Admin with overall system control'),
(2, 'ROLE_FACTORY_MANAGER', 'Factory & Production Manager'),
(3, 'ROLE_STORE_MANAGER', 'Inventory & Warehouse Store Manager'),
(4, 'ROLE_SALES_MANAGER', 'Sales & Delivery Fleet Manager'),
(5, 'ROLE_DRIVER', 'Delivery Driver & Spot Sales Representative'),
(6, 'ROLE_SHOP_OWNER', 'Retail Shop Owner')
ON CONFLICT (name) DO NOTHING;

-- Seed Admin User (Password: admin123)
INSERT INTO users (id, username, password, full_name, email, phone, is_active) VALUES
(1, 'admin', '$2a$10$e7aWd4M/9C9aR.RpxGg2EOp4m2Jp9XyWd9s5X4V5t5/5W5u.5W5W5', 'System Administrator', 'admin@breadfactory.com', '9876543210', true)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_roles (user_id, role_id) VALUES (1, 1) ON CONFLICT DO NOTHING;
