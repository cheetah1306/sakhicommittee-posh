import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Helper functions wrapper for Promises
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export const initDb = async () => {
  // Enable foreign keys
  await dbRun('PRAGMA foreign_keys = ON');

  // Create companies table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sector TEXT NOT NULL,
      state TEXT NOT NULL,
      employee_count INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create ic_members table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS ic_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('presiding', 'employee', 'external')) NOT NULL,
      gender TEXT CHECK(gender IN ('female', 'male', 'other')) NOT NULL,
      term_start DATETIME NOT NULL,
      term_end DATETIME NOT NULL
    )
  `);

  // Create users table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'ic_member', 'district_officer')) NOT NULL,
      company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
      ic_member_id INTEGER REFERENCES ic_members(id) ON DELETE SET NULL
    )
  `);

  // Create cases table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      tracking_code TEXT UNIQUE NOT NULL,
      status TEXT CHECK(status IN ('Received', 'Acknowledged', 'Under Inquiry', 'Report Drafted', 'Awaiting Employer Action', 'Resolved', 'Appealed')) NOT NULL,
      received_at DATETIME NOT NULL,
      incident_date DATETIME NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      is_anonymous INTEGER CHECK(is_anonymous IN (0, 1)) NOT NULL,
      complainant_name TEXT NULL,
      complainant_contact TEXT NULL,
      deadline_90 DATETIME NOT NULL,
      deadline_100 DATETIME NOT NULL,
      deadline_160 DATETIME NOT NULL,
      has_conciliation_offered INTEGER DEFAULT 0,
      has_conciliation_agreed INTEGER DEFAULT 0,
      has_hearing_given INTEGER DEFAULT 0,
      has_evidence_reviewed INTEGER DEFAULT 0
    )
  `);

  // Create case_events table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS case_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      note TEXT NOT NULL,
      actor_name TEXT NOT NULL
    )
  `);

  // Create documents table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
      type TEXT CHECK(type IN ('policy', 'appointment_letter', 'inquiry_report', 'annual_report', 'board_disclosure')) NOT NULL,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      content TEXT NOT NULL
    )
  `);

  // Create training_logs table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS training_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      date DATETIME NOT NULL,
      attendee_count INTEGER NOT NULL,
      topic TEXT NOT NULL
    )
  `);

  // Create demo_settings table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS demo_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      time_offset_days INTEGER DEFAULT 0
    )
  `);

  // Ensure default demo settings row exists
  const settings = await dbGet('SELECT * FROM demo_settings WHERE id = 1');
  if (!settings) {
    await dbRun('INSERT INTO demo_settings (id, time_offset_days) VALUES (1, 0)');
  }
};

export async function getTimeOffset() {
  const row = await dbGet('SELECT time_offset_days FROM demo_settings WHERE id = 1');
  return row ? row.time_offset_days : 0;
}

export async function getSystemDate() {
  const offset = await getTimeOffset();
  return new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
}

export default db;
