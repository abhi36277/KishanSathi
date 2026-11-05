-- ====================================================================
-- KisanSathi AI - Database Seed Data (Demo Farmer & Pilot Crops)
-- ====================================================================

-- Demo Farmer (Karnataka pilot: Mandya district)
INSERT INTO farmers (id, auth_user_id, name, phone, state, district, village, language, latitude, longitude, is_demo)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Ramesh Gowda',
    '+919876543210',
    'Karnataka',
    'Mandya',
    'Shivalli',
    'kn',
    12.523800,
    76.896700,
    TRUE
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Demo Farm
INSERT INTO farms (id, farmer_id, area_acres, soil_type)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    2.50,
    'Red Sandy Loam'
) ON CONFLICT (id) DO UPDATE SET area_acres = EXCLUDED.area_acres;

-- Demo Crop (Rice - Day 35: Tillering stage)
INSERT INTO crops (id, farmer_id, crop_name, sowing_date, variety, growth_stage)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Rice',
    CURRENT_DATE - INTERVAL '35 days',
    'JGL 1798 (Paddy)',
    'Tillering'
) ON CONFLICT (id) DO UPDATE SET growth_stage = EXCLUDED.growth_stage;

-- Demo Crop 2 (Wheat - Punjab pilot for demonstration)
INSERT INTO farmers (id, auth_user_id, name, phone, state, district, village, language, latitude, longitude, is_demo)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    'Gurpreet Singh',
    '+919812345678',
    'Punjab',
    'Ludhiana',
    'Khanna',
    'hi',
    30.901000,
    75.857300,
    TRUE
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO farms (id, farmer_id, area_acres, soil_type)
VALUES (
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000004',
    4.00,
    'Alluvial Loam'
) ON CONFLICT (id) DO UPDATE SET area_acres = EXCLUDED.area_acres;

INSERT INTO crops (id, farmer_id, crop_name, sowing_date, variety, growth_stage)
VALUES (
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000004',
    'Wheat',
    CURRENT_DATE - INTERVAL '30 days',
    'PBW 550',
    'Crown Root Initiation (CRI)'
) ON CONFLICT (id) DO UPDATE SET growth_stage = EXCLUDED.growth_stage;

-- Demo Community Post
INSERT INTO community_posts (farmer_id, author_name, district, title, content, topic, upvotes)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Ramesh Gowda',
    'Mandya',
    'Tractor sharing available for harrowing next Tuesday',
    'Anyone in Shivalli village needing rotavator/tractor service can coordinate to split fuel costs.',
    'Equipment & Transport',
    5
);

-- Demo Pest Alert
INSERT INTO pest_alerts (state, district, pest_or_disease, crop_affected, severity, alert_message)
VALUES (
    'Karnataka',
    'Mandya',
    'Yellow Stem Borer',
    'Rice',
    'medium',
    'Stem borer deadhearts spotted in neighboring blocks. Inspect central tillers during morning hours. Consult KVK V.C. Farm Mandya.'
);
