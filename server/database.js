import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'houses.db')
const db = new Database(dbPath)

export function initDatabase() {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 房源表
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      type TEXT DEFAULT '整租',
      status TEXT DEFAULT '空置',
      monthly_rent REAL DEFAULT 0,
      area REAL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // 租客表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      id_card TEXT,
      emergency_contact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // 合同表
  db.exec(`
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER,
      tenant_id INTEGER,
      contract_image TEXT,
      start_date DATE,
      end_date DATE,
      monthly_rent REAL,
      deposit REAL,
      status TEXT DEFAULT '生效',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `)

  // 租金记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS rent_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      contract_id INTEGER,
      amount REAL,
      pay_date DATE,
      status TEXT DEFAULT '已支付',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    )
  `)

  // 为已有数据库添加 user_id 字段
  const tables = ['properties', 'tenants', 'contracts', 'rent_records']
  for (const table of tables) {
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN user_id INTEGER`).run()
    } catch (e) {
      // 字段已存在，忽略
    }
  }

  console.log('Database initialized successfully')
}

export default db
