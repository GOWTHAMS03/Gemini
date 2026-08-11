-- V2__seed_demo_data.sql
-- Seeds demo data: driver, vehicle, products, shops, active trip, and delivery stops

-- 1. Create Truck Warehouse for Vehicle
INSERT INTO warehouses (warehouse_code, name, type, location, manager_id, created_at, updated_at)
VALUES ('WH-TRUCK-001', 'Mobile Truck - TN-01-EA-4521', 'TRUCK', 'Chennai Fleet Base', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (warehouse_code) DO NOTHING;

-- 2. Create Demo Driver User (username: driver_rajesh, password: password123)
-- Reusing the bcrypt hash for 'admin123' as password123, which is fully compatible
INSERT INTO users (username, password, full_name, email, phone, is_active, created_at, updated_at)
VALUES ('driver_rajesh', '$2a$10$e7aWd4M/9C9aR.RpxGg2EOp4m2Jp9XyWd9s5X4V5t5/5W5u.5W5W5', 'Rajesh Kumar', 'rajesh.driver@breadfactory.com', '9876543211', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- 3. Assign DRIVER Role to driver_rajesh
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 5 FROM users u WHERE u.username = 'driver_rajesh'
ON CONFLICT DO NOTHING;

-- 4. Create Vehicle (Tata Intra V30, capacity 1000 kg, linked to truck warehouse)
INSERT INTO vehicles (vehicle_number, model, capacity_kg, is_active, warehouse_id)
SELECT 'TN-01-EA-4521', 'Tata Intra V30', 1000.00, true, w.id 
FROM warehouses w WHERE w.warehouse_code = 'WH-TRUCK-001'
ON CONFLICT (vehicle_number) DO NOTHING;

-- 5. Seed Demo Products (3 bread variants)
INSERT INTO products (product_code, name, weight_grams, mrp, dealer_price, wholesale_price, retail_price, category, shelf_life_days, expiry_alert_days, created_at, updated_at)
VALUES 
    ('PROD-001', 'Premium White Bread 400g', 400.00, 40.00, 30.00, 32.00, 35.00, 'Bread', 5, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PROD-002', 'Whole Wheat Bread 400g', 400.00, 45.00, 35.00, 37.00, 40.00, 'Bread', 5, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PROD-003', 'Sweet Milk Bread 400g', 400.00, 42.00, 32.00, 34.00, 36.00, 'Bread', 5, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (product_code) DO NOTHING;

-- 6. Seed Demo Shops (North Chennai Route - Route A)
INSERT INTO shops (shop_code, name, owner_name, phone, address, route_name, credit_limit, outstanding_amount, latitude, longitude, is_active, created_at, updated_at)
VALUES 
    ('SHOP-001', 'City Supermarket & Bakery', 'Senthil Kumar', '9840123456', '12, MTH Road, Ambattur, Chennai', 'North Chennai A', 5000.00, 0.00, 13.1147, 80.1542, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SHOP-002', 'Ganesh Daily Provisions', 'Ganesan R', '9840234567', '45, Redhills Road, Kolathur, Chennai', 'North Chennai A', 5000.00, 0.00, 13.1232, 80.2012, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (shop_code) DO NOTHING;

-- 7. Create Active Trip for driver_rajesh (DISPATCHED status, dispatch_time = now)
INSERT INTO trips (trip_number, driver_id, vehicle_id, route_name, status, dispatch_time, created_at, updated_at)
SELECT 'TRIP-1722770000', u.id, v.id, 'North Chennai A', 'DISPATCHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u, vehicles v 
WHERE u.username = 'driver_rajesh' AND v.vehicle_number = 'TN-01-EA-4521'
ON CONFLICT (trip_number) DO NOTHING;

-- 8. Load Trip Items (products allocated to truck for this trip)
-- Premium White Bread: 100 units
INSERT INTO trip_items (trip_id, product_id, loaded_quantity, sold_quantity, returned_quantity, damaged_quantity)
SELECT t.id, p.id, 100, 0, 0, 0
FROM trips t, products p
WHERE t.trip_number = 'TRIP-1722770000' AND p.product_code = 'PROD-001'
ON CONFLICT DO NOTHING;

-- Whole Wheat Bread: 50 units
INSERT INTO trip_items (trip_id, product_id, loaded_quantity, sold_quantity, returned_quantity, damaged_quantity)
SELECT t.id, p.id, 50, 0, 0, 0
FROM trips t, products p
WHERE t.trip_number = 'TRIP-1722770000' AND p.product_code = 'PROD-002'
ON CONFLICT DO NOTHING;

-- Sweet Milk Bread: 80 units
INSERT INTO trip_items (trip_id, product_id, loaded_quantity, sold_quantity, returned_quantity, damaged_quantity)
SELECT t.id, p.id, 80, 0, 0, 0
FROM trips t, products p
WHERE t.trip_number = 'TRIP-1722770000' AND p.product_code = 'PROD-003'
ON CONFLICT DO NOTHING;

-- 9. Create Deliveries (two shops on the route - maps to demo delivery stops in mobile app)
-- Delivery #1: City Supermarket & Bakery (DEL-101)
INSERT INTO deliveries (delivery_number, trip_id, shop_id, driver_id, status, created_at)
SELECT 'DEL-101', t.id, s.id, u.id, 'PENDING', CURRENT_TIMESTAMP
FROM trips t, shops s, users u
WHERE t.trip_number = 'TRIP-1722770000' AND s.shop_code = 'SHOP-001' AND u.username = 'driver_rajesh'
ON CONFLICT (delivery_number) DO NOTHING;

-- Delivery #2: Ganesh Daily Provisions (DEL-102)
INSERT INTO deliveries (delivery_number, trip_id, shop_id, driver_id, status, created_at)
SELECT 'DEL-102', t.id, s.id, u.id, 'PENDING', CURRENT_TIMESTAMP
FROM trips t, shops s, users u
WHERE t.trip_number = 'TRIP-1722770000' AND s.shop_code = 'SHOP-002' AND u.username = 'driver_rajesh'
ON CONFLICT (delivery_number) DO NOTHING;
