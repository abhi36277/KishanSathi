-- ====================================================================
-- KisanSathi AI - MySQL Auto-Export Dump
-- Generated: 2026-11-05T11:13:37.423Z
-- ====================================================================

CREATE DATABASE IF NOT EXISTS kisansathi;
USE kisansathi;

SET FOREIGN_KEY_CHECKS = 0;


-- Farmers table
TRUNCATE TABLE farmers;
INSERT INTO farmers (id, auth_user_id, name, phone, state, district, village, language, latitude, longitude, is_demo, created_at) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Ramesh Gowda', '+919876543210', 'Karnataka', 'Mandya', 'Shivalli', 'kn', 12.5238, 76.8967, 1, '2026-11-05 10:47:32'),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Gurpreet Singh', '+919812345678', 'Punjab', 'Ludhiana', 'Khanna', 'hi', 30.901, 75.8573, 1, '2026-11-05 10:47:32'),
('66d71efd-760c-49f3-b2fb-8e92340e351a', 'cb74ee97-3387-4c8f-b249-4e57d1c71d10', 'Suresh Kumar', '+919988776655', 'Karnataka', 'Mysuru', 'Nanjangud', 'kn', 12.12, 76.68, 0, '2026-11-05 10:48:48');

-- Farms table
TRUNCATE TABLE farms;
INSERT INTO farms (id, farmer_id, area_acres, soil_type, created_at) VALUES
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 2.5, 'Red Sandy Loam', '2026-11-05 10:47:32'),
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 4, 'Alluvial Loam', '2026-11-05 10:47:32'),
('4a1afa3a-a9b4-4cfa-a04b-8644a74628bc', '66d71efd-760c-49f3-b2fb-8e92340e351a', 3, 'Red Sandy Loam', '2026-11-05 10:48:48');

-- Crops table
TRUNCATE TABLE crops;
INSERT INTO crops (id, farmer_id, crop_name, sowing_date, variety, growth_stage, created_at) VALUES
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Rice', '2026-10-01', 'JGL 1798 (Paddy)', 'Tillering', '2026-11-05 10:47:32'),
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004', 'Wheat', '2026-10-11', 'PBW 550', 'Crown Root Initiation (CRI)', '2026-11-05 10:47:32'),
('0165eb4b-40e1-4065-8bea-715121526ac0', '66d71efd-760c-49f3-b2fb-8e92340e351a', 'Rice', '2026-10-10', 'Standard Variety', 'Germination / Early Vegetative', '2026-11-05 10:48:48');

-- Farm Expenses table
TRUNCATE TABLE farm_expenses;
INSERT INTO farm_expenses (id, farmer_id, category, amount, description, voice_transcript, expense_date, created_at) VALUES
('exp-01', '00000000-0000-0000-0000-000000000001', 'fertilizer', 850, 'Urea top dressing 1 bag', 'bought one bag of urea for 850 rupees', '2026-11-05', '2026-11-05 10:47:32');

-- Transport Pools table
TRUNCATE TABLE transport_pools;
INSERT INTO transport_pools (id, farmer_id, origin, destination_mandi, departure_date, total_capacity_kg, available_capacity_kg, cost_per_kg, vehicle_type, contact_phone, status, created_at) VALUES
('pool-01', '00000000-0000-0000-0000-000000000001', 'Shivalli, Mandya', 'APMC Yard Mandya', '2026-11-07', 2000, 800, 1.5, 'Tata Ace (Chota Hathi)', '+919876543210', 'open', '2026-11-05 10:47:32');

-- Community Posts table
TRUNCATE TABLE community_posts;
INSERT INTO community_posts (id, farmer_id, author_name, district, title, content, topic, upvotes, created_at) VALUES
('post-01', '00000000-0000-0000-0000-000000000001', 'Ramesh Gowda', 'Mandya', 'Tractor sharing available for harrowing next Tuesday', 'Anyone in Shivalli village needing rotavator/tractor service can coordinate to split diesel costs.', 'Equipment & Transport', 5, '2026-11-05 10:47:32');

-- Pest Alerts table
TRUNCATE TABLE pest_alerts;
INSERT INTO pest_alerts (id, reporter_farmer_id, state, district, pest_or_disease, crop_affected, severity, alert_message, created_at) VALUES
('pest-01', '00000000-0000-0000-0000-000000000001', 'Karnataka', 'Mandya', 'Yellow Stem Borer', 'Rice', 'medium', 'Stem borer deadhearts spotted in neighboring blocks. Inspect central tillers during morning hours. Consult KVK V.C. Farm Mandya.', '2026-11-05 10:47:32');

SET FOREIGN_KEY_CHECKS = 1;
