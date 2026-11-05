-- ====================================================================
-- KisanSathi AI - MySQL Database Schema & Seed Data
-- Compatible with MySQL Server 8.0, 8.4+, MySQL Workbench, phpMyAdmin
-- ====================================================================

CREATE DATABASE IF NOT EXISTS kisansathi;
USE kisansathi;

-- 1. Farmers table
CREATE TABLE IF NOT EXISTS farmers (
    id VARCHAR(36) PRIMARY KEY,
    auth_user_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    village VARCHAR(100),
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Farms table
CREATE TABLE IF NOT EXISTS farms (
    id VARCHAR(36) PRIMARY KEY,
    farmer_id VARCHAR(36) NOT NULL,
    area_acres DECIMAL(6, 2) NOT NULL,
    soil_type VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

-- 3. Crops table
CREATE TABLE IF NOT EXISTS crops (
    id VARCHAR(36) PRIMARY KEY,
    farmer_id VARCHAR(36) NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    sowing_date DATE NOT NULL,
    variety VARCHAR(100),
    growth_stage VARCHAR(100) NOT NULL DEFAULT 'Sowing/Germination',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

-- 4. Daily Action Plans (Signature Differentiator)
CREATE TABLE IF NOT EXISTS action_plans (
    id VARCHAR(36) PRIMARY KEY,
    farmer_id VARCHAR(36) NOT NULL,
    crop_id VARCHAR(36) NOT NULL,
    plan_date DATE NOT NULL,
    task_key VARCHAR(100) NOT NULL,
    task_title VARCHAR(255) NOT NULL,
    task_description TEXT NOT NULL,
    reason TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL,
    due_date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    source VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_crop_plan_task (crop_id, plan_date, task_key),
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- 5. Chat History
CREATE TABLE IF NOT EXISTS chat_history (
    id VARCHAR(36) PRIMARY KEY,
    farmer_id VARCHAR(36) NOT NULL,
    role VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

-- 6. Farm Voice & Financial Expenses
CREATE TABLE IF NOT EXISTS farm_expenses (
    id VARCHAR(36) PRIMARY KEY,
    farmer_id VARCHAR(36) NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    voice_transcript TEXT,
    expense_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

-- 7. Transport Pooling
CREATE TABLE IF NOT EXISTS transport_pools (
    id VARCHAR(36) PRIMARY KEY,
    farmer_id VARCHAR(36) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination_mandi VARCHAR(255) NOT NULL,
    departure_date DATE NOT NULL,
    total_capacity_kg DECIMAL(8, 2) NOT NULL,
    available_capacity_kg DECIMAL(8, 2) NOT NULL,
    cost_per_kg DECIMAL(6, 2) NOT NULL,
    vehicle_type VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

-- 8. Community Forum & Discussion
CREATE TABLE IF NOT EXISTS community_posts (
    id VARCHAR(36) PRIMARY KEY,
    farmer_id VARCHAR(36) NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    topic VARCHAR(100) NOT NULL,
    upvotes INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);

-- 9. Regional Pest Alerts
CREATE TABLE IF NOT EXISTS pest_alerts (
    id VARCHAR(36) PRIMARY KEY,
    reporter_farmer_id VARCHAR(36),
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    pest_or_disease VARCHAR(100) NOT NULL,
    crop_affected VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    alert_message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- SEED DATA FOR MYSQL
-- ====================================================================

INSERT INTO farmers (id, auth_user_id, name, phone, state, district, village, language, latitude, longitude, is_demo)
VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Ramesh Gowda', '+919876543210', 'Karnataka', 'Mandya', 'Shivalli', 'kn', 12.523800, 76.896700, 1),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Gurpreet Singh', '+919812345678', 'Punjab', 'Ludhiana', 'Khanna', 'hi', 30.901000, 75.857300, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO farms (id, farmer_id, area_acres, soil_type)
VALUES
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 2.50, 'Red Sandy Loam'),
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 4.00, 'Alluvial Loam')
ON DUPLICATE KEY UPDATE area_acres=VALUES(area_acres);

INSERT INTO crops (id, farmer_id, crop_name, sowing_date, variety, growth_stage)
VALUES
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Rice', DATE_SUB(CURDATE(), INTERVAL 35 DAY), 'JGL 1798 (Paddy)', 'Tillering'),
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004', 'Wheat', DATE_SUB(CURDATE(), INTERVAL 25 DAY), 'PBW 550', 'Crown Root Initiation (CRI)')
ON DUPLICATE KEY UPDATE growth_stage=VALUES(growth_stage);

INSERT INTO farm_expenses (id, farmer_id, category, amount, description, voice_transcript, expense_date)
VALUES
('exp-01', '00000000-0000-0000-0000-000000000001', 'fertilizer', 850.00, 'Urea top dressing 1 bag', 'bought one bag of urea for 850 rupees', CURDATE())
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

INSERT INTO transport_pools (id, farmer_id, origin, destination_mandi, departure_date, total_capacity_kg, available_capacity_kg, cost_per_kg, vehicle_type, contact_phone, status)
VALUES
('pool-01', '00000000-0000-0000-0000-000000000001', 'Shivalli, Mandya', 'APMC Yard Mandya', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 2000.00, 800.00, 1.50, 'Tata Ace (Chota Hathi)', '+919876543210', 'open')
ON DUPLICATE KEY UPDATE cost_per_kg=VALUES(cost_per_kg);

INSERT INTO community_posts (id, farmer_id, author_name, district, title, content, topic, upvotes)
VALUES
('post-01', '00000000-0000-0000-0000-000000000001', 'Ramesh Gowda', 'Mandya', 'Tractor sharing available for harrowing next Tuesday', 'Anyone in Shivalli village needing rotavator/tractor service can coordinate to split fuel costs.', 'Equipment & Transport', 5)
ON DUPLICATE KEY UPDATE upvotes=VALUES(upvotes);

INSERT INTO pest_alerts (id, reporter_farmer_id, state, district, pest_or_disease, crop_affected, severity, alert_message)
VALUES
('pest-01', '00000000-0000-0000-0000-000000000001', 'Karnataka', 'Mandya', 'Yellow Stem Borer', 'Rice', 'medium', 'Stem borer deadhearts spotted in neighboring blocks. Inspect central tillers during morning hours. Consult KVK V.C. Farm Mandya.')
ON DUPLICATE KEY UPDATE alert_message=VALUES(alert_message);
