const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Grant Management API', () => {
    let grantor1Token;
    let grantor2Token;
    let adminToken;
    let granteeToken;
    let grant1Id;

    beforeEach(async () => {
        db.resetInMemoryStore();

        // Register Grantor 1
        const g1 = await request(app).post('/api/auth/register').send({
            name: 'Grantor One',
            email: 'grantor1@example.com',
            password: 'Password123!'
        });
        // Admin assigns GRANTOR role to Grantor 1
        const adminLogin = await request(app).post('/api/auth/login').send({
            email: 'admin@portal.com',
            password: 'AdminPassword123!'
        });
        adminToken = adminLogin.body.accessToken;

        await request(app)
            .post(`/api/users/${g1.body.id}/roles`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ roleName: 'GRANTOR' });

        const g1Login = await request(app).post('/api/auth/login').send({
            email: 'grantor1@example.com',
            password: 'Password123!'
        });
        grantor1Token = g1Login.body.accessToken;

        // Register Grantor 2
        const g2 = await request(app).post('/api/auth/register').send({
            name: 'Grantor Two',
            email: 'grantor2@example.com',
            password: 'Password123!'
        });
        await request(app)
            .post(`/api/users/${g2.body.id}/roles`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ roleName: 'GRANTOR' });

        const g2Login = await request(app).post('/api/auth/login').send({
            email: 'grantor2@example.com',
            password: 'Password123!'
        });
        grantor2Token = g2Login.body.accessToken;

        // Register Grantee
        const gee = await request(app).post('/api/auth/register').send({
            name: 'Grantee User',
            email: 'grantee@example.com',
            password: 'Password123!'
        });
        const geeLogin = await request(app).post('/api/auth/login').send({
            email: 'grantee@example.com',
            password: 'Password123!'
        });
        granteeToken = geeLogin.body.accessToken;

        // Create initial grant by Grantor 1
        const createRes = await request(app)
            .post('/api/grants')
            .set('Authorization', `Bearer ${grantor1Token}`)
            .send({
                title: 'Initial Tech Grant',
                description: 'Grant for tech projects',
                amount: 25000
            });

        grant1Id = createRes.body.id;
    });

    describe('POST /api/grants', () => {
        it('should allow GRANTOR to create a new grant', async () => {
            const res = await request(app)
                .post('/api/grants')
                .set('Authorization', `Bearer ${grantor1Token}`)
                .send({
                    title: 'Clean Energy Grant',
                    description: 'Funding for clean energy startups',
                    amount: 100000
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('title', 'Clean Energy Grant');
            expect(res.body).toHaveProperty('amount', 100000);
        });

        it('should return 400 for missing grant fields', async () => {
            const res = await request(app)
                .post('/api/grants')
                .set('Authorization', `Bearer ${grantor1Token}`)
                .send({
                    title: 'Incomplete Grant'
                });

            expect(res.statusCode).toEqual(400);
        });
    });

    describe('GET /api/grants', () => {
        it('should allow GRANTEE, GRANTOR, or ADMIN to list all grants', async () => {
            const res = await request(app)
                .get('/api/grants')
                .set('Authorization', `Bearer ${granteeToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });

        it('should return 404 for non-existent grant ID', async () => {
            const res = await request(app)
                .get('/api/grants/00000000-0000-0000-0000-000000000999')
                .set('Authorization', `Bearer ${granteeToken}`);

            expect(res.statusCode).toEqual(404);
        });
    });

    describe('PUT /api/grants/:grantId', () => {
        it('should allow the owner GRANTOR to update their grant', async () => {
            const res = await request(app)
                .put(`/api/grants/${grant1Id}`)
                .set('Authorization', `Bearer ${grantor1Token}`)
                .send({
                    title: 'Updated Tech Grant Title',
                    description: 'Updated description',
                    amount: 30000
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('title', 'Updated Tech Grant Title');
            expect(res.body).toHaveProperty('amount', 30000);
        });

        it('should return 403 when a non-owner GRANTOR attempts to update grant', async () => {
            const res = await request(app)
                .put(`/api/grants/${grant1Id}`)
                .set('Authorization', `Bearer ${grantor2Token}`)
                .send({
                    title: 'Hacked Title',
                    description: 'Hacked description',
                    amount: 50000
                });

            expect(res.statusCode).toEqual(403);
        });
    });

    describe('DELETE /api/grants/:grantId', () => {
        it('should return 403 when a non-owner GRANTOR attempts to delete grant', async () => {
            const res = await request(app)
                .delete(`/api/grants/${grant1Id}`)
                .set('Authorization', `Bearer ${grantor2Token}`);

            expect(res.statusCode).toEqual(403);
        });

        it('should allow owner GRANTOR or ADMIN to delete grant', async () => {
            const res = await request(app)
                .delete(`/api/grants/${grant1Id}`)
                .set('Authorization', `Bearer ${grantor1Token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message');
        });
    });
});
