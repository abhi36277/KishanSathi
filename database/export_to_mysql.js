import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, 'local_db.json');
const outSqlPath = path.join(__dirname, 'kisansathi_dump.sql');

if (!fs.existsSync(jsonPath)) {
  console.error('local_db.json does not exist yet. Run the app first.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let sql = `-- ====================================================================
-- KisanSathi AI - MySQL Auto-Export Dump
-- Generated: ${new Date().toISOString()}
-- ====================================================================

CREATE DATABASE IF NOT EXISTS kisansathi;
USE kisansathi;

SET FOREIGN_KEY_CHECKS = 0;

`;

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  let str = String(val);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str)) {
    str = str.replace('T', ' ').replace(/\..*$/, '');
  }
  return `'${str.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

// Farmers
if (data.farmers && data.farmers.length > 0) {
  sql += `\n-- Farmers table\nTRUNCATE TABLE farmers;\nINSERT INTO farmers (id, auth_user_id, name, phone, state, district, village, language, latitude, longitude, is_demo, created_at) VALUES\n`;
  sql += data.farmers.map(f => `(${escapeSql(f.id)}, ${escapeSql(f.auth_user_id)}, ${escapeSql(f.name)}, ${escapeSql(f.phone)}, ${escapeSql(f.state)}, ${escapeSql(f.district)}, ${escapeSql(f.village)}, ${escapeSql(f.language)}, ${f.latitude}, ${f.longitude}, ${f.is_demo ? 1 : 0}, ${escapeSql(f.created_at || new Date().toISOString())})`).join(',\n') + ';\n';
}

// Farms
if (data.farms && data.farms.length > 0) {
  sql += `\n-- Farms table\nTRUNCATE TABLE farms;\nINSERT INTO farms (id, farmer_id, area_acres, soil_type, created_at) VALUES\n`;
  sql += data.farms.map(f => `(${escapeSql(f.id)}, ${escapeSql(f.farmer_id)}, ${f.area_acres}, ${escapeSql(f.soil_type)}, ${escapeSql(f.created_at || new Date().toISOString())})`).join(',\n') + ';\n';
}

// Crops
if (data.crops && data.crops.length > 0) {
  sql += `\n-- Crops table\nTRUNCATE TABLE crops;\nINSERT INTO crops (id, farmer_id, crop_name, sowing_date, variety, growth_stage, created_at) VALUES\n`;
  sql += data.crops.map(c => `(${escapeSql(c.id)}, ${escapeSql(c.farmer_id)}, ${escapeSql(c.crop_name)}, ${escapeSql(c.sowing_date)}, ${escapeSql(c.variety)}, ${escapeSql(c.growth_stage)}, ${escapeSql(c.created_at || new Date().toISOString())})`).join(',\n') + ';\n';
}

// Action Plans
if (data.action_plans && data.action_plans.length > 0) {
  sql += `\n-- Action Plans table\nTRUNCATE TABLE action_plans;\nINSERT INTO action_plans (id, farmer_id, crop_id, plan_date, task_key, task_title, task_description, reason, priority, due_date, completed, source, created_at) VALUES\n`;
  sql += data.action_plans.map(a => `(${escapeSql(a.id)}, ${escapeSql(a.farmer_id)}, ${escapeSql(a.crop_id)}, ${escapeSql(a.plan_date)}, ${escapeSql(a.task_key)}, ${escapeSql(a.task_title)}, ${escapeSql(a.task_description)}, ${escapeSql(a.reason)}, ${escapeSql(a.priority)}, ${escapeSql(a.due_date)}, ${a.completed ? 1 : 0}, ${escapeSql(a.source)}, ${escapeSql(a.created_at || new Date().toISOString())})`).join(',\n') + ';\n';
}

// Farm Expenses
if (data.farm_expenses && data.farm_expenses.length > 0) {
  sql += `\n-- Farm Expenses table\nTRUNCATE TABLE farm_expenses;\nINSERT INTO farm_expenses (id, farmer_id, category, amount, description, voice_transcript, expense_date, created_at) VALUES\n`;
  sql += data.farm_expenses.map(e => `(${escapeSql(e.id)}, ${escapeSql(e.farmer_id)}, ${escapeSql(e.category)}, ${e.amount}, ${escapeSql(e.description)}, ${escapeSql(e.voice_transcript)}, ${escapeSql(e.expense_date)}, ${escapeSql(e.created_at || new Date().toISOString())})`).join(',\n') + ';\n';
}

// Transport Pools
if (data.transport_pools && data.transport_pools.length > 0) {
  sql += `\n-- Transport Pools table\nTRUNCATE TABLE transport_pools;\nINSERT INTO transport_pools (id, farmer_id, origin, destination_mandi, departure_date, total_capacity_kg, available_capacity_kg, cost_per_kg, vehicle_type, contact_phone, status, created_at) VALUES\n`;
  sql += data.transport_pools.map(p => `(${escapeSql(p.id)}, ${escapeSql(p.farmer_id)}, ${escapeSql(p.origin)}, ${escapeSql(p.destination_mandi)}, ${escapeSql(p.departure_date)}, ${p.total_capacity_kg}, ${p.available_capacity_kg}, ${p.cost_per_kg}, ${escapeSql(p.vehicle_type)}, ${escapeSql(p.contact_phone)}, ${escapeSql(p.status)}, ${escapeSql(p.created_at || new Date().toISOString())})`).join(',\n') + ';\n';
}

// Community Posts
if (data.community_posts && data.community_posts.length > 0) {
  sql += `\n-- Community Posts table\nTRUNCATE TABLE community_posts;\nINSERT INTO community_posts (id, farmer_id, author_name, district, title, content, topic, upvotes, created_at) VALUES\n`;
  sql += data.community_posts.map(p => `(${escapeSql(p.id)}, ${escapeSql(p.farmer_id)}, ${escapeSql(p.author_name)}, ${escapeSql(p.district)}, ${escapeSql(p.title)}, ${escapeSql(p.content)}, ${escapeSql(p.topic)}, ${p.upvotes || 0}, ${escapeSql(p.created_at || new Date().toISOString())})`).join(',\n') + ';\n';
}

// Pest Alerts
if (data.pest_alerts && data.pest_alerts.length > 0) {
  sql += `\n-- Pest Alerts table\nTRUNCATE TABLE pest_alerts;\nINSERT INTO pest_alerts (id, reporter_farmer_id, state, district, pest_or_disease, crop_affected, severity, alert_message, created_at) VALUES\n`;
  sql += data.pest_alerts.map(p => `(${escapeSql(p.id)}, ${escapeSql(p.reporter_farmer_id)}, ${escapeSql(p.state)}, ${escapeSql(p.district)}, ${escapeSql(p.pest_or_disease)}, ${escapeSql(p.crop_affected)}, ${escapeSql(p.severity)}, ${escapeSql(p.alert_message)}, ${escapeSql(p.created_at || new Date().toISOString())})`).join(',\n') + ';\n';
}

sql += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;

fs.writeFileSync(outSqlPath, sql, 'utf8');
console.log(`✅ Successfully exported live database to MySQL dump: ${outSqlPath}`);
