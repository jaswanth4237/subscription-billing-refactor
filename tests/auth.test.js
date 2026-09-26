const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const db = require('../src/config/db');

describe('Authentication & OAuth API', () => {
    beforeEach(() => {
        db.resetInMemoryStore();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user with default GRANTEE role and return user profile without password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Jane Grantee',
                    email: 'jane@example.com',
                    password: 'Password123!'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('name', 'Jane Grantee');
            expect(res.body).toHaveProperty('email', 'jane@example.com');
            expect(res.body).not.toHaveProperty('password');
            expect(res.body).not.toHaveProperty('password_hash');
        });

        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'missingname@example.com'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should return 409 if user email already exists', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Duplicate User',
                    email: 'dup@example.com',
                    password: 'Password123!'
                });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Duplicate User 2',
                    email: 'dup@example.com',
                    password: 'Password123!'
                });

            expect(res.statusCode).toEqual(409);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Login User',
                    email: 'login@example.com',
                    password: 'Password123!'
                });
        });

        it('should authenticate valid credentials and return a valid JWT', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'Password123!'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('accessToken');

            const decoded = jwt.verify(res.body.accessToken, env.JWT_SECRET);
            expect(decoded).toHaveProperty('userId');
            expect(decoded).toHaveProperty('roles');
            expect(Array.isArray(decoded.roles)).toBe(true);
        });

        it('should return 401 for incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'WrongPassword!'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('error');
        });

        it('should return 401 for non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Password123!'
                });

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('OAuth 2.0 Integration', () => {
        it('should redirect GET /api/auth/google to provider authorization URL', async () => {
            const res = await request(app).get('/api/auth/google');
            expect(res.statusCode).toEqual(302);
            expect(res.headers.location).toContain('accounts.google.com');
        });

        it('should process OAuth callback and issue JWT for user', async () => {
            const res = await request(app)
                .get('/api/auth/google/callback?code=mock_code_test_123');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('accessToken');

            const decoded = jwt.verify(res.body.accessToken, env.JWT_SECRET);
            expect(decoded).toHaveProperty('userId');
            expect(decoded).toHaveProperty('roles');
        });

        it('should return 400 if OAuth callback is missing code', async () => {
            const res = await request(app).get('/api/auth/google/callback');
            expect(res.statusCode).toEqual(400);
        });
    });
});
