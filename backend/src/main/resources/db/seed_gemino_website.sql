-- seed_gemino_website.sql
-- Seed categories and premium products for Gemino Foods Industry website

CREATE TABLE IF NOT EXISTS contact_inquiries (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    company_name VARCHAR(150),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    inquiry_type VARCHAR(50) DEFAULT 'GENERAL',
    status VARCHAR(30) DEFAULT 'NEW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Delete old demo products to refresh cleanly with full metadata
DELETE FROM products WHERE product_code LIKE 'GEM-%' OR product_code IN ('PROD-001', 'PROD-002', 'PROD-003');

-- Insert Categories
INSERT INTO product_categories (code, name, slug, hsn_code, gst_rate, item_count, color, status, created_at)
VALUES
('CAT-BRD', 'Daily Breads', 'daily-breads', '1905 90 10', '5%', 4, 'bg-amber-500/10 text-amber-700 border-amber-500/20', 'ACTIVE', CURRENT_TIMESTAMP),
('CAT-ART', 'Artisan & Sourdough', 'artisan-sourdough', '1905 90 20', '5%', 3, 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', 'ACTIVE', CURRENT_TIMESTAMP),
('CAT-BUN', 'Buns & Pav', 'buns-pav', '1905 90 30', '5%', 3, 'bg-orange-500/10 text-orange-700 border-orange-500/20', 'ACTIVE', CURRENT_TIMESTAMP),
('CAT-RSK', 'Rusks & Toasters', 'rusks-toasters', '1905 90 90', '5%', 2, 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', 'ACTIVE', CURRENT_TIMESTAMP),
('CAT-CAK', 'Tea Cakes & Pastries', 'tea-cakes-pastries', '1905 90 40', '18%', 2, 'bg-rose-500/10 text-rose-700 border-rose-500/20', 'ACTIVE', CURRENT_TIMESTAMP)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, status = EXCLUDED.status;

-- Insert High Quality Products
INSERT INTO products (
    product_code, name, barcode, image_url, weight_grams, mrp, minimum_selling_price, 
    dealer_price, wholesale_price, retail_price, category, shelf_life_days, expiry_alert_days, created_at, updated_at
) VALUES
(
    'GEM-BRD-01', 
    'Gemino Signature White Sandwich Bread', 
    '8904889770101', 
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop',
    400.00, 45.00, 42.00, 32.00, 35.00, 42.00, 
    'Daily Breads', 5, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'GEM-BRD-02', 
    'Gemino 100% Whole Wheat Brown Bread', 
    '8904889770102', 
    'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=1000&auto=format&fit=crop',
    400.00, 52.00, 48.00, 38.00, 41.00, 49.00, 
    'Daily Breads', 5, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'GEM-BRD-03', 
    'Gemino Sweet Honey Milk Bread', 
    '8904889770103', 
    'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?q=80&w=1000&auto=format&fit=crop',
    400.00, 48.00, 45.00, 35.00, 38.00, 45.00, 
    'Daily Breads', 5, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'GEM-BRD-04', 
    'Gemino 7-Grain Multigrain Health Loaf', 
    '8904889770104', 
    'https://images.unsplash.com/photo-1534620808146-d33bb39128b2?q=80&w=1000&auto=format&fit=crop',
    450.00, 65.00, 60.00, 48.00, 52.00, 62.00, 
    'Daily Breads', 6, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'GEM-ART-01', 
    'Artisanal Wild Yeast Sourdough Boule', 
    '8904889770201', 
    'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?q=80&w=1000&auto=format&fit=crop',
    500.00, 125.00, 115.00, 90.00, 98.00, 120.00, 
    'Artisan & Sourdough', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'GEM-ART-02', 
    'French Garlic & Herb Crusty Baguette', 
    '8904889770202', 
    'https://images.unsplash.com/photo-1579697096985-41fe1430e5df?q=80&w=1000&auto=format&fit=crop',
    300.00, 75.00, 68.00, 52.00, 58.00, 70.00, 
    'Artisan & Sourdough', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'GEM-ART-03', 
    'Rosemary & Extra Virgin Olive Oil Focaccia', 
    '8904889770203', 
    'https://images.unsplash.com/photo-1589367921021-99884a20b0fa?q=80&w=1000&auto=format&fit=crop',
    400.00, 95.00, 88.00, 68.00, 75.00, 90.00, 
    'Artisan & Sourdough', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'GEM-BUN-01', 
    'Golden Glazed Brioche Burger Buns (Pack of 4)', 
    '8904889770301', 
    'https://images.unsplash.com/photo-1598373182133-52452f7691ef?q=80&w=1000&auto=format&fit=crop',
    300.00, 60.00, 54.00, 42.00, 46.00, 58.00, 
    'Buns & Pav', 5, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'GEM-BUN-02', 
    'Gemino Authentic Mumbai Soft Ladi Pav (Pack of 6)', 
    '8904889770302', 
    'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?q=80&w=1000&auto=format&fit=crop',
    300.00, 35.00, 30.00, 22.00, 25.00, 32.00, 
    'Buns & Pav', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'GEM-BUN-03', 
    'Herb Butter Dinner Pull-Apart Rolls (Pack of 6)', 
    '8904889770303', 
    'https://images.unsplash.com/photo-1621236378699-8597fab4a1de?q=80&w=1000&auto=format&fit=crop',
    350.00, 65.00, 58.00, 45.00, 50.00, 62.00, 
    'Buns & Pav', 5, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'GEM-RSK-01', 
    'Gemino Royal Cardamom (Elaichi) Toast Rusk', 
    '8904889770401', 
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=1000&auto=format&fit=crop',
    400.00, 55.00, 50.00, 38.00, 42.00, 52.00, 
    'Rusks & Toasters', 90, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'GEM-RSK-02', 
    'Crispy Butter Garlic Wheat Toast Rusk', 
    '8904889770402', 
    'https://images.unsplash.com/photo-1579697096987-a2f05a109724?q=80&w=1000&auto=format&fit=crop',
    350.00, 60.00, 55.00, 42.00, 46.00, 58.00, 
    'Rusks & Toasters', 90, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'GEM-CAK-01', 
    'Traditional Rich Dry Fruit & Nut Tea Cake', 
    '8904889770501', 
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1000&auto=format&fit=crop',
    250.00, 95.00, 88.00, 68.00, 74.00, 90.00, 
    'Tea Cakes & Pastries', 21, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'GEM-CAK-02', 
    'Flaky French Pure Butter Croissants (Pack of 2)', 
    '8904889770502', 
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1000&auto=format&fit=crop',
    200.00, 110.00, 100.00, 78.00, 85.00, 105.00, 
    'Tea Cakes & Pastries', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
