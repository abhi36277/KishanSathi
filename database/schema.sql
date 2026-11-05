-- ====================================================================
-- KisanSathi AI - Database Schema (PostgreSQL / Supabase)
-- ====================================================================

-- 1. Farmers table
CREATE TABLE IF NOT EXISTS farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID,
    name TEXT NOT NULL,
    phone TEXT,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    village TEXT,
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'kn')),
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmers_auth_user_id ON farmers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_farmers_location ON farmers(state, district);

-- 2. Farms table
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    area_acres NUMERIC(6, 2) NOT NULL CHECK (area_acres > 0),
    soil_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON farms(farmer_id);

-- 3. Crops table
CREATE TABLE IF NOT EXISTS crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    sowing_date DATE NOT NULL,
    variety TEXT,
    growth_stage TEXT NOT NULL DEFAULT 'Sowing/Germination',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crops_farmer_id ON crops(farmer_id);

-- 4. Daily Action Plans (Signature Differentiator)
CREATE TABLE IF NOT EXISTS action_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    task_key TEXT NOT NULL,
    task_title TEXT NOT NULL,
    task_description TEXT NOT NULL,
    reason TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    due_date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_crop_plan_task UNIQUE (crop_id, plan_date, task_key)
);

CREATE INDEX IF NOT EXISTS idx_action_plans_farmer ON action_plans(farmer_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_crop_date ON action_plans(crop_id, plan_date);

-- 5. Chat History
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_farmer_id ON chat_history(farmer_id, created_at ASC);

-- 6. Disease & Field Photo Reports (Monthly Monitoring + Pest Alerts)
CREATE TABLE IF NOT EXISTS disease_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    image_path TEXT,
    prediction TEXT,
    confidence NUMERIC(5, 2),
    symptoms TEXT,
    recommendations TEXT,
    is_pest_alert BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disease_reports_farmer ON disease_reports(farmer_id);

-- 7. Farm Voice & Financial Expenses
CREATE TABLE IF NOT EXISTS farm_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('seeds', 'fertilizer', 'pesticide', 'irrigation', 'labor', 'machinery', 'transport', 'other')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    voice_transcript TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farm_expenses_farmer ON farm_expenses(farmer_id, expense_date);

-- 8. Crop Loss Insurance Evidence (PMFBY Assistant)
CREATE TABLE IF NOT EXISTS crop_loss_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    calamity_type TEXT NOT NULL,
    loss_percentage NUMERIC(5, 2),
    incident_date DATE NOT NULL,
    photo_urls JSONB DEFAULT '[]'::JSONB,
    document_urls JSONB DEFAULT '[]'::JSONB,
    notes TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crop_loss_farmer ON crop_loss_evidence(farmer_id);

-- 9. Transport Pooling
CREATE TABLE IF NOT EXISTS transport_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    origin TEXT NOT NULL,
    destination_mandi TEXT NOT NULL,
    departure_date DATE NOT NULL,
    total_capacity_kg NUMERIC(8, 2) NOT NULL,
    available_capacity_kg NUMERIC(8, 2) NOT NULL,
    cost_per_kg NUMERIC(6, 2) NOT NULL,
    vehicle_type TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Community Forum & Discussion
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    district TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    topic TEXT NOT NULL,
    upvotes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Regional Pest & Weather Alerts
CREATE TABLE IF NOT EXISTS pest_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_farmer_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    pest_or_disease TEXT NOT NULL,
    crop_affected TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    alert_message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_loss_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_alerts ENABLE ROW LEVEL SECURITY;

-- Anonymous and Authenticated Ownership Policies:
CREATE POLICY "Farmers can view own profile or demo" ON farmers
    FOR SELECT USING (auth.uid() = auth_user_id OR is_demo = TRUE);

CREATE POLICY "Farmers can update own profile" ON farmers
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Farmers can insert own profile" ON farmers
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id OR auth_user_id IS NULL);

-- Cascade ownership checks for related tables:
CREATE POLICY "Farms access" ON farms
    FOR ALL USING (EXISTS (SELECT 1 FROM farmers f WHERE f.id = farms.farmer_id AND (f.auth_user_id = auth.uid() OR f.is_demo = TRUE)));

CREATE POLICY "Crops access" ON crops
    FOR ALL USING (EXISTS (SELECT 1 FROM farmers f WHERE f.id = crops.farmer_id AND (f.auth_user_id = auth.uid() OR f.is_demo = TRUE)));

CREATE POLICY "Action plan access" ON action_plans
    FOR ALL USING (EXISTS (SELECT 1 FROM farmers f WHERE f.id = action_plans.farmer_id AND (f.auth_user_id = auth.uid() OR f.is_demo = TRUE)));

CREATE POLICY "Chat history access" ON chat_history
    FOR ALL USING (EXISTS (SELECT 1 FROM farmers f WHERE f.id = chat_history.farmer_id AND (f.auth_user_id = auth.uid() OR f.is_demo = TRUE)));

CREATE POLICY "Disease reports access" ON disease_reports
    FOR ALL USING (EXISTS (SELECT 1 FROM farmers f WHERE f.id = disease_reports.farmer_id AND (f.auth_user_id = auth.uid() OR f.is_demo = TRUE)));

CREATE POLICY "Expenses access" ON farm_expenses
    FOR ALL USING (EXISTS (SELECT 1 FROM farmers f WHERE f.id = farm_expenses.farmer_id AND (f.auth_user_id = auth.uid() OR f.is_demo = TRUE)));

CREATE POLICY "Crop loss evidence access" ON crop_loss_evidence
    FOR ALL USING (EXISTS (SELECT 1 FROM farmers f WHERE f.id = crop_loss_evidence.farmer_id AND (f.auth_user_id = auth.uid() OR f.is_demo = TRUE)));

-- Public / Community tables:
CREATE POLICY "Transport pools public read" ON transport_pools FOR SELECT USING (TRUE);
CREATE POLICY "Transport pools farmer write" ON transport_pools FOR ALL USING (EXISTS (SELECT 1 FROM farmers f WHERE f.id = transport_pools.farmer_id AND (f.auth_user_id = auth.uid() OR f.is_demo = TRUE)));

CREATE POLICY "Community posts public read" ON community_posts FOR SELECT USING (TRUE);
CREATE POLICY "Community posts farmer write" ON community_posts FOR ALL USING (EXISTS (SELECT 1 FROM farmers f WHERE f.id = community_posts.farmer_id AND (f.auth_user_id = auth.uid() OR f.is_demo = TRUE)));

CREATE POLICY "Pest alerts public read" ON pest_alerts FOR SELECT USING (TRUE);
