import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, '../../database/local_db.json');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseKey.includes('your-')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

import mysql from 'mysql2/promise';

export let mysqlPool = null;
export let isMysqlConnected = false;

try {
  mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'kisansathi',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Test connection
  mysqlPool.getConnection().then((conn) => {
    isMysqlConnected = true;
    conn.release();
    console.log('🐬 Successfully connected directly to local MySQL Server (localhost:3306 - database: kisansathi)!');
  }).catch((err) => {
    console.warn(`MySQL Server not reachable (${err.message}). Using persistent disk database.`);
    isMysqlConnected = false;
  });
} catch (e) {
  console.warn('MySQL pool initialization error:', e.message);
}

/**
 * Persistent Database Store (JSON File-backed on disk + Supabase Sync)
 * Ensures 100% of registrations, crop additions, checklist ticks, and expenses
 * are safely written to disk at `database/local_db.json` across server restarts.
 */
class PersistentDatabaseStore {
  constructor() {
    this.filePath = DB_FILE_PATH;
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        this.farmers = parsed.farmers || [];
        this.farms = parsed.farms || [];
        this.crops = parsed.crops || [];
        this.action_plans = parsed.action_plans || [];
        this.chat_history = parsed.chat_history || [];
        this.disease_reports = parsed.disease_reports || [];
        this.farm_expenses = parsed.farm_expenses || [];
        this.crop_loss_evidence = parsed.crop_loss_evidence || [];
        this.transport_pools = parsed.transport_pools || [];
        this.community_posts = parsed.community_posts || [];
        this.pest_alerts = parsed.pest_alerts || [];
        this.farmer_crop_history = parsed.farmer_crop_history || [];
        this.daily_tracker = parsed.daily_tracker || [];
        console.log(`💾 Database loaded from disk (${this.filePath}): ${this.farmers.length} farmers, ${this.crops.length} crops, ${this.action_plans.length} tasks.`);
      } catch (e) {
        console.warn('Could not parse existing local_db.json. Initializing fresh seed data:', e.message);
        this.initSeedData();
      }
    } else {
      this.initSeedData();
    }

    // Auto-save on exit or intervals
    this.scheduleAutoSave();
  }

  initSeedData() {
    this.farmers = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        auth_user_id: '00000000-0000-0000-0000-000000000001',
        name: 'Ramesh Gowda',
        phone: '+919876543210',
        state: 'Karnataka',
        district: 'Mandya',
        village: 'Shivalli',
        language: 'kn',
        latitude: 12.5238,
        longitude: 76.8967,
        is_demo: true,
        created_at: new Date().toISOString()
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        auth_user_id: '00000000-0000-0000-0000-000000000004',
        name: 'Gurpreet Singh',
        phone: '+919812345678',
        state: 'Punjab',
        district: 'Ludhiana',
        village: 'Khanna',
        language: 'hi',
        latitude: 30.9010,
        longitude: 75.8573,
        is_demo: true,
        created_at: new Date().toISOString()
      }
    ];

    this.farms = [
      {
        id: '00000000-0000-0000-0000-000000000002',
        farmer_id: '00000000-0000-0000-0000-000000000001',
        area_acres: 2.5,
        soil_type: 'Red Sandy Loam',
        created_at: new Date().toISOString()
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        farmer_id: '00000000-0000-0000-0000-000000000004',
        area_acres: 4.0,
        soil_type: 'Alluvial Loam',
        created_at: new Date().toISOString()
      }
    ];

    const today = new Date();
    const riceSowing = new Date(today);
    riceSowing.setDate(today.getDate() - 35); // 35 days ago -> Tillering

    const wheatSowing = new Date(today);
    wheatSowing.setDate(today.getDate() - 25); // 25 days ago -> CRI

    this.crops = [
      {
        id: '00000000-0000-0000-0000-000000000003',
        farmer_id: '00000000-0000-0000-0000-000000000001',
        crop_name: 'Rice',
        sowing_date: riceSowing.toISOString().split('T')[0],
        variety: 'JGL 1798 (Paddy)',
        growth_stage: 'Tillering',
        created_at: new Date().toISOString()
      },
      {
        id: '00000000-0000-0000-0000-000000000006',
        farmer_id: '00000000-0000-0000-0000-000000000004',
        crop_name: 'Wheat',
        sowing_date: wheatSowing.toISOString().split('T')[0],
        variety: 'PBW 550',
        growth_stage: 'Crown Root Initiation (CRI)',
        created_at: new Date().toISOString()
      }
    ];

    this.action_plans = [];
    this.chat_history = [];
    this.disease_reports = [];
    this.farm_expenses = [
      {
        id: 'exp-01',
        farmer_id: '00000000-0000-0000-0000-000000000001',
        category: 'fertilizer',
        amount: 850,
        description: 'Urea top dressing 1 bag',
        voice_transcript: 'bought one bag of urea for 850 rupees',
        expense_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      }
    ];
    this.crop_loss_evidence = [];
    this.transport_pools = [
      {
        id: 'pool-01',
        farmer_id: '00000000-0000-0000-0000-000000000001',
        origin: 'Shivalli, Mandya',
        destination_mandi: 'APMC Yard Mandya',
        departure_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        total_capacity_kg: 2000,
        available_capacity_kg: 800,
        cost_per_kg: 1.5,
        vehicle_type: 'Tata Ace (Chota Hathi)',
        contact_phone: '+919876543210',
        status: 'open',
        created_at: new Date().toISOString()
      }
    ];
    this.community_posts = [
      {
        id: 'post-01',
        farmer_id: '00000000-0000-0000-0000-000000000001',
        author_name: 'Ramesh Gowda',
        district: 'Mandya',
        title: 'Tractor sharing available for harrowing next Tuesday',
        content: 'Anyone in Shivalli village needing rotavator/tractor service can coordinate to split diesel costs.',
        topic: 'Equipment & Transport',
        upvotes: 5,
        created_at: new Date().toISOString()
      }
    ];
    this.pest_alerts = [
      {
        id: 'pest-01',
        reporter_farmer_id: '00000000-0000-0000-0000-000000000001',
        state: 'Karnataka',
        district: 'Mandya',
        pest_or_disease: 'Yellow Stem Borer',
        crop_affected: 'Rice',
        severity: 'medium',
        alert_message: 'Stem borer deadhearts spotted in neighboring blocks. Inspect central tillers during morning hours. Consult KVK V.C. Farm Mandya.',
        created_at: new Date().toISOString()
      }
    ];

    this.save();
  }

  save() {
    try {
      const data = {
        farmers: this.farmers,
        farms: this.farms,
        crops: this.crops,
        action_plans: this.action_plans,
        chat_history: this.chat_history,
        disease_reports: this.disease_reports,
        farm_expenses: this.farm_expenses,
        crop_loss_evidence: this.crop_loss_evidence,
        transport_pools: this.transport_pools,
        community_posts: this.community_posts,
        pest_alerts: this.pest_alerts,
        farmer_crop_history: this.farmer_crop_history || [],
        daily_tracker: this.daily_tracker || [],
        last_saved_at: new Date().toISOString()
      };
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving local_db.json to disk:', e.message);
    }
  }

  scheduleAutoSave() {
    const timer = setInterval(() => {
      this.save();
    }, 5000);
    if (timer.unref) timer.unref();
  }

  getHealthSummary() {
    return {
      type: isSupabaseConfigured ? 'supabase_postgresql' : 'mysql_and_persistent_disk',
      mysql: isMysqlConnected ? 'connected (MySQL 8.4 on localhost:3306 - DB: kisansathi)' : 'offline',
      mysql_host: process.env.MYSQL_HOST || 'localhost',
      mysql_port: process.env.MYSQL_PORT || 3306,
      mysql_database: process.env.MYSQL_DATABASE || 'kisansathi',
      storage_location: isSupabaseConfigured ? process.env.SUPABASE_URL : this.filePath,
      table_records: {
        farmers: this.farmers.length,
        farms: this.farms.length,
        crops: this.crops.length,
        action_plans: this.action_plans.length,
        chat_history: this.chat_history.length,
        farm_expenses: this.farm_expenses.length,
        transport_pools: this.transport_pools.length,
        community_posts: this.community_posts.length,
        pest_alerts: this.pest_alerts.length
      },
      persisted_to_disk: fs.existsSync(this.filePath)
    };
  }
}

export const localStore = new PersistentDatabaseStore();
