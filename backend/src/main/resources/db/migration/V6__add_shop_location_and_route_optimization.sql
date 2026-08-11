-- V6__add_shop_location_and_route_optimization.sql
-- Enhances shops, delivery routes, and route stops with location, depots, and optimization attributes

-- 1. Enhance Shops Table with accuracy and area
ALTER TABLE shops ADD COLUMN IF NOT EXISTS location_accuracy NUMERIC(8,2) DEFAULT 5.0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS area_name VARCHAR(150);

-- Update demo shops with realistic coordinates in Salem / Tamil Nadu region if null
UPDATE shops 
SET latitude = 11.664300, longitude = 78.146000, area_name = 'Salem City Center', location_accuracy = 4.5
WHERE shop_code = 'SHOP-001' AND (latitude IS NULL OR latitude = 0);

UPDATE shops 
SET latitude = 11.658200, longitude = 78.139500, area_name = 'Shevapet Market', location_accuracy = 5.0
WHERE shop_code = 'SHOP-002' AND (latitude IS NULL OR latitude = 0);

-- Seed additional demo shops in Salem region for rich route testing
INSERT INTO shops (shop_code, name, owner_name, phone, address, area_name, route_name, credit_limit, outstanding_amount, latitude, longitude, location_accuracy, is_active, created_at, updated_at)
VALUES 
    ('SHOP-003', 'Sri Lakshmi Stores', 'Rajesh K', '9840345678', '14, Fort Main Road, Salem', 'Fort Area', 'Salem North Route', 8000.00, 0.00, 11.656700, 78.157800, 3.8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SHOP-004', 'Kumar Traders & Provisions', 'Kumaravel P', '9840456789', '78, Omalur Main Road, Fairlands, Salem', 'Fairlands', 'Salem North Route', 10000.00, 0.00, 11.678900, 78.141200, 4.2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SHOP-005', 'ABC Super Market', 'Anand Babu', '9840567890', '23, Cherry Road, Hasthampatti, Salem', 'Hasthampatti', 'Salem North Route', 12000.00, 0.00, 11.684500, 78.163400, 3.5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SHOP-006', 'Raja Stores & Bakery', 'Rajarajan S', '9840678901', '89, Attur Main Road, Ammapet, Salem', 'Ammapet', 'Salem North Route', 6000.00, 0.00, 11.651200, 78.182300, 5.2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SHOP-007', 'Balaji Daily Needs', 'Balachandar M', '9840789012', '56, Junction Main Road, Suramangalam, Salem', 'Suramangalam', 'Salem North Route', 7500.00, 0.00, 11.672300, 78.118900, 4.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (shop_code) DO NOTHING;

-- 2. Enhance Delivery Routes Table with Start/End Depots, Outdated status, Duration, and GeoJSON geometry
ALTER TABLE delivery_routes ADD COLUMN IF NOT EXISTS start_latitude NUMERIC(10,8) DEFAULT 10.787252191240228;
ALTER TABLE delivery_routes ADD COLUMN IF NOT EXISTS start_longitude NUMERIC(11,8) DEFAULT 79.57505803846621;
ALTER TABLE delivery_routes ADD COLUMN IF NOT EXISTS start_location_name VARCHAR(200) DEFAULT 'Central Factory & Distribution Hub';
ALTER TABLE delivery_routes ADD COLUMN IF NOT EXISTS end_latitude NUMERIC(10,8) DEFAULT 10.787252191240228;
ALTER TABLE delivery_routes ADD COLUMN IF NOT EXISTS end_longitude NUMERIC(11,8) DEFAULT 79.57505803846621;
ALTER TABLE delivery_routes ADD COLUMN IF NOT EXISTS end_location_name VARCHAR(200) DEFAULT 'Central Plant & Distribution Hub - Salem';
ALTER TABLE delivery_routes ADD COLUMN IF NOT EXISTS estimated_duration_minutes INT DEFAULT 45;
ALTER TABLE delivery_routes ADD COLUMN IF NOT EXISTS is_outdated BOOLEAN DEFAULT FALSE;
ALTER TABLE delivery_routes ADD COLUMN IF NOT EXISTS geometry_geojson TEXT;
ALTER TABLE delivery_routes ADD COLUMN IF NOT EXISTS encoded_polyline TEXT;
ALTER TABLE delivery_routes ADD COLUMN IF NOT EXISTS optimized_order_applied BOOLEAN DEFAULT FALSE;

-- 3. Enhance Route Shops with Shop Name, Address, and Distance from Previous Stop
ALTER TABLE route_shops ADD COLUMN IF NOT EXISTS shop_name VARCHAR(150);
ALTER TABLE route_shops ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE route_shops ADD COLUMN IF NOT EXISTS distance_from_prev_km NUMERIC(8,2) DEFAULT 0.0;

-- 4. Seed a Demo North Salem Delivery Route if none exists
INSERT INTO delivery_routes (route_code, route_name, description, starting_hub, start_latitude, start_longitude, start_location_name, end_latitude, end_longitude, end_location_name, assigned_driver, driver_phone, assigned_vehicle, total_shops, total_distance_km, distance_km, dispatch_time, estimated_duration, estimated_duration_minutes, status, created_at, updated_at)
VALUES 
    ('RT-SALEM-01', 'Salem North Commercial Route', 'Daily morning retail bread delivery covering City Center, Fairlands, Hasthampatti, Ammapet, and Suramangalam', 'Central Plant & Distribution Hub - Salem', 11.664300, 78.146000, 'Central Plant & Distribution Hub - Salem', 11.664300, 78.146000, 'Central Plant & Distribution Hub - Salem', 'Rajesh Kumar', '9876543211', 'TN-01-EA-4521', 5, 27.4, 27.4, '05:30 AM', '1h 15m', 75, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (route_code) DO NOTHING;

-- Link demo shops to RT-SALEM-01 in visit order
INSERT INTO route_shops (route_id, shop_id, visit_order, latitude, longitude, shop_name, address, distance_from_prev_km, created_at)
SELECT r.id, s.id, 1, s.latitude, s.longitude, s.name, s.address, 2.5, CURRENT_TIMESTAMP
FROM delivery_routes r, shops s 
WHERE r.route_code = 'RT-SALEM-01' AND s.shop_code = 'SHOP-003'
ON CONFLICT DO NOTHING;

INSERT INTO route_shops (route_id, shop_id, visit_order, latitude, longitude, shop_name, address, distance_from_prev_km, created_at)
SELECT r.id, s.id, 2, s.latitude, s.longitude, s.name, s.address, 3.2, CURRENT_TIMESTAMP
FROM delivery_routes r, shops s 
WHERE r.route_code = 'RT-SALEM-01' AND s.shop_code = 'SHOP-004'
ON CONFLICT DO NOTHING;

INSERT INTO route_shops (route_id, shop_id, visit_order, latitude, longitude, shop_name, address, distance_from_prev_km, created_at)
SELECT r.id, s.id, 3, s.latitude, s.longitude, s.name, s.address, 4.1, CURRENT_TIMESTAMP
FROM delivery_routes r, shops s 
WHERE r.route_code = 'RT-SALEM-01' AND s.shop_code = 'SHOP-005'
ON CONFLICT DO NOTHING;

INSERT INTO route_shops (route_id, shop_id, visit_order, latitude, longitude, shop_name, address, distance_from_prev_km, created_at)
SELECT r.id, s.id, 4, s.latitude, s.longitude, s.name, s.address, 5.8, CURRENT_TIMESTAMP
FROM delivery_routes r, shops s 
WHERE r.route_code = 'RT-SALEM-01' AND s.shop_code = 'SHOP-006'
ON CONFLICT DO NOTHING;

INSERT INTO route_shops (route_id, shop_id, visit_order, latitude, longitude, shop_name, address, distance_from_prev_km, created_at)
SELECT r.id, s.id, 5, s.latitude, s.longitude, s.name, s.address, 6.2, CURRENT_TIMESTAMP
FROM delivery_routes r, shops s 
WHERE r.route_code = 'RT-SALEM-01' AND s.shop_code = 'SHOP-007'
ON CONFLICT DO NOTHING;
