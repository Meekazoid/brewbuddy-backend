// ==========================================
// BREWBUDDY DATABASE MODULE
// Supports both SQLite (dev) and PostgreSQL (production)
// ==========================================

import pg from 'pg';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

let db = null;
let dbType = null;

/**
 * Initialize database connection
 * Uses PostgreSQL in production (Railway), SQLite in development
 */
export async function initDatabase() {
    const isProduction = process.env.NODE_ENV === 'production';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    
    // Use PostgreSQL in production if DATABASE_URL is set
    if (isProduction && hasDatabaseUrl) {
        console.log('📊 Initializing PostgreSQL database...');
        dbType = 'postgresql';
        
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false // Required for Railway
            }
        });
        
        // Test connection
        try {
            await pool.query('SELECT NOW()');
            console.log('✅ PostgreSQL connection successful');
        } catch (err) {
            console.error('❌ PostgreSQL connection failed:', err.message);
            throw err;
        }
        
        // Create wrapper for consistent API
        db = {
            pool,
            async exec(sql) {
                const statements = sql.split(';').filter(s => s.trim());
                for (const statement of statements) {
                    if (statement.trim()) {
                        await pool.query(statement);
                    }
                }
            },
            async get(sql, params = []) {
                const result = await pool.query(sql, params);
                return result.rows[0] || null;
            },
            async all(sql, params = []) {
                const result = await pool.query(sql, params);
                return result.rows;
            },
            async run(sql, params = []) {
                const result = await pool.query(sql, params);
                return { 
                    lastID: result.rows[0]?.id, 
                    changes: result.rowCount 
                };
            }
        };
        
        // Create tables for PostgreSQL
        await createPostgreSQLTables();
        
        console.log('✅ PostgreSQL database initialized');
        
    } else {
        // Use SQLite for development
        console.log('📊 Initializing SQLite database...');
        dbType = 'sqlite';
        
        const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'brewbuddy.db');
        
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        await createSQLiteTables();

        console.log('✅ SQLite database initialized:', dbPath);
    }
    
    return { db, dbType };
}

/**
 * Create PostgreSQL tables
 */
async function createPostgreSQLTables() {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            token TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS coffees (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_coffees_user_id ON coffees(user_id);
        CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);
        CREATE INDEX IF NOT EXISTS idx_coffees_user_created ON coffees(user_id, created_at DESC);
    `);
}

/**
 * Create SQLite tables
 */
async function createSQLiteTables() {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            token TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS coffees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_coffees_user_id ON coffees(user_id);
        CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);
        CREATE INDEX IF NOT EXISTS idx_coffees_user_created ON coffees(user_id, created_at DESC);
    `);
}

/**
 * Get database instance
 */
export function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

/**
 * Get database type
 */
export function getDatabaseType() {
    return dbType;
}

/**
 * Close database connection
 */
export async function closeDatabase() {
    if (db && dbType === 'postgresql') {
        await db.pool.end();
        console.log('✅ PostgreSQL connection closed');
    } else if (db && dbType === 'sqlite') {
        await db.close();
        console.log('✅ SQLite connection closed');
    }
    db = null;
    dbType = null;
}

/**
 * Query helpers that work with both databases
 */
export const queries = {
    /**
     * Get user by token
     */
    async getUserByToken(token) {
        const db = getDatabase();
        if (dbType === 'postgresql') {
            return db.get(
                'SELECT id, username, created_at FROM users WHERE token = $1', 
                [token]
            );
        } else {
            return db.get(
                'SELECT id, username, created_at FROM users WHERE token = ?', 
                [token]
            );
        }
    },
    
    /**
     * Create new user
     */
    async createUser(username, token) {
        const db = getDatabase();
        if (dbType === 'postgresql') {
            const result = await db.get(
                'INSERT INTO users (username, token) VALUES ($1, $2) RETURNING id',
                [username, token]
            );
            return result.id;
        } else {
            const result = await db.run(
                'INSERT INTO users (username, token) VALUES (?, ?)',
                [username, token]
            );
            return result.lastID;
        }
    },
    
    /**
     * Get user count
     */
    async getUserCount() {
        const db = getDatabase();
        const result = await db.get('SELECT COUNT(*) as count FROM users');
        return result.count;
    },
    
    /**
     * Check if username exists (case-insensitive)
     */
    async usernameExists(username) {
        const db = getDatabase();
        if (dbType === 'postgresql') {
            const result = await db.get(
                'SELECT id FROM users WHERE LOWER(username) = LOWER($1)', 
                [username]
            );
            return !!result;
        } else {
            const result = await db.get(
                'SELECT id FROM users WHERE LOWER(username) = LOWER(?)', 
                [username]
            );
            return !!result;
        }
    },
    
    /**
     * Get all coffees for a user
     */
    async getUserCoffees(userId) {
        const db = getDatabase();
        if (dbType === 'postgresql') {
            return db.all(
                'SELECT id, data, created_at FROM coffees WHERE user_id = $1 ORDER BY created_at DESC',
                [userId]
            );
        } else {
            return db.all(
                'SELECT id, data, created_at FROM coffees WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );
        }
    },
    
    /**
     * Save coffee for user
     */
    async saveCoffee(userId, data) {
        const db = getDatabase();
        if (dbType === 'postgresql') {
            const result = await db.get(
                'INSERT INTO coffees (user_id, data) VALUES ($1, $2) RETURNING id',
                [userId, data]
            );
            return result.id;
        } else {
            const result = await db.run(
                'INSERT INTO coffees (user_id, data) VALUES (?, ?)',
                [userId, data]
            );
            return result.lastID;
        }
    },
    
    /**
     * Delete all coffees for a user
     */
    async deleteUserCoffees(userId) {
        const db = getDatabase();
        if (dbType === 'postgresql') {
            await db.run('DELETE FROM coffees WHERE user_id = $1', [userId]);
        } else {
            await db.run('DELETE FROM coffees WHERE user_id = ?', [userId]);
        }
    }
};

export default {
    initDatabase,
    getDatabase,
    getDatabaseType,
    closeDatabase,
    queries
};
