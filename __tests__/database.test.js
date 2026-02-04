// Unit Tests for BrewBuddy Database Module
// Run with: npm test

import { initDatabase, queries, closeDatabase, getDatabaseType } from '../db/database.js';

describe('Database Module', () => {
    beforeAll(async () => {
        // Use SQLite for testing
        process.env.NODE_ENV = 'development';
        delete process.env.DATABASE_URL;
        await initDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('Database Initialization', () => {
        test('should initialize database', () => {
            const dbType = getDatabaseType();
            expect(dbType).toBeDefined();
            expect(['sqlite', 'postgresql']).toContain(dbType);
        });
    });

    describe('User Operations', () => {
        const testUser = {
            username: 'testuser_' + Date.now(),
            token: 'test-token-' + Date.now()
        };

        test('should create a new user', async () => {
            const userId = await queries.createUser(testUser.username, testUser.token);
            expect(userId).toBeDefined();
            expect(userId).toBeGreaterThan(0);
        });

        test('should retrieve user by token', async () => {
            const user = await queries.getUserByToken(testUser.token);
            expect(user).toBeDefined();
            expect(user.username).toBe(testUser.username);
        });

        test('should check if username exists', async () => {
            const exists = await queries.usernameExists(testUser.username);
            expect(exists).toBe(true);

            const notExists = await queries.usernameExists('nonexistentuser12345');
            expect(notExists).toBe(false);
        });

        test('should get user count', async () => {
            const count = await queries.getUserCount();
            expect(count).toBeGreaterThan(0);
        });

        test('should handle case-insensitive username check', async () => {
            const existsLower = await queries.usernameExists(testUser.username.toLowerCase());
            const existsUpper = await queries.usernameExists(testUser.username.toUpperCase());
            expect(existsLower).toBe(true);
            expect(existsUpper).toBe(true);
        });
    });

    describe('Coffee Operations', () => {
        let testUserId;
        const testToken = 'coffee-test-token-' + Date.now();

        beforeAll(async () => {
            testUserId = await queries.createUser('coffeeuser_' + Date.now(), testToken);
        });

        test('should save coffee for user', async () => {
            const coffeeData = JSON.stringify({
                name: 'Test Coffee',
                origin: 'Ethiopia',
                process: 'washed'
            });

            const coffeeId = await queries.saveCoffee(testUserId, coffeeData);
            expect(coffeeId).toBeDefined();
            expect(coffeeId).toBeGreaterThan(0);
        });

        test('should retrieve user coffees', async () => {
            const coffees = await queries.getUserCoffees(testUserId);
            expect(Array.isArray(coffees)).toBe(true);
            expect(coffees.length).toBeGreaterThan(0);
        });

        test('should delete user coffees', async () => {
            await queries.deleteUserCoffees(testUserId);
            const coffees = await queries.getUserCoffees(testUserId);
            expect(coffees.length).toBe(0);
        });
    });
});
