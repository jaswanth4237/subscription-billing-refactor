const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Application Management API', () => {
    let grantor1Token;
    let grantor2Token;
    let grantee1Token;
    let grantee2Token;
    let adminToken;
    let grantId;
    let applicationId;

    beforeEach(async () => {
        db.resetInMemoryStore();

        // Login as default admin
        const adminLogin = await request(app).post('/api/auth/login').send({
            email: 'admin@portal.com',
            password: 'AdminPassword123!'
        });
        adminToken = adminLogin.body.accessToken;

        // Setup Grantor 1
        const g1 = await request(app).post('/api/auth/register').send({
            name: 'Grantor One',
            email: 'grantor1@example.com',
            password: 'Password123!'
        });
        await request(app)
            .post(`/api/users/${g1.body.id}/roles`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ roleName: 'GRANTOR' });
        const g1Login = await request(app).post('/api/auth/login').send({
            email: 'grantor1@example.com',
            password: 'Password123!'
        });
        grantor1Token = g1Login.body.accessToken;

        // Setup Grantor 2
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

        // Setup Grantee 1
        const gee1 = await request(app).post('/api/auth/register').send({
            name: 'Grantee One',
            email: 'grantee1@example.com',
            password: 'Password123!'
        });
        const gee1Login = await request(app).post('/api/auth/login').send({
            email: 'grantee1@example.com',
            password: 'Password123!'
        });
        grantee1Token = gee1Login.body.accessToken;

        // Setup Grantee 2
        const gee2 = await request(app).post('/api/auth/register').send({
            name: 'Grantee Two',
            email: 'grantee2@example.com',
            password: 'Password123!'
        });
        const gee2Login = await request(app).post('/api/auth/login').send({
            email: 'grantee2@example.com',
            password: 'Password123!'
        });
        grantee2Token = gee2Login.body.accessToken;

        // Create Grant by Grantor 1
        const grantRes = await request(app)
            .post('/api/grants')
            .set('Authorization', `Bearer ${grantor1Token}`)
            .send({
                title: 'Education Grant',
                description: 'Funding for educational software',
                amount: 40000
            });

        grantId = grantRes.body.id;

        // Grantee 1 applies for the grant
        const appRes = await request(app)
            .post(`/api/grants/${grantId}/apply`)
            .set('Authorization', `Bearer ${grantee1Token}`)
            .send({
                proposal: 'We plan to build open-source educational games for STEM.'
            });

        applicationId = appRes.body.id;
    });

    describe('POST /api/grants/:grantId/apply', () => {
        it('should allow GRANTEE to submit a proposal for an existing grant', async () => {
            const res = await request(app)
                .post(`/api/grants/${grantId}/apply`)
                .set('Authorization', `Bearer ${grantee2Token}`)
                .send({
                    proposal: 'Proposal for remote tutoring platforms.'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('grant_id', grantId);
            expect(res.body).toHaveProperty('proposal', 'Proposal for remote tutoring platforms.');
            expect(res.body).toHaveProperty('status', 'submitted');
        });

        it('should return 400 if proposal is missing', async () => {
            const res = await request(app)
                .post(`/api/grants/${grantId}/apply`)
                .set('Authorization', `Bearer ${grantee2Token}`)
                .send({});

            expect(res.statusCode).toEqual(400);
        });

        it('should return 404 if grant does not exist', async () => {
            const res = await request(app)
                .post('/api/grants/00000000-0000-0000-0000-000000000999/apply')
                .set('Authorization', `Bearer ${grantee2Token}`)
                .send({ proposal: 'Some proposal' });

            expect(res.statusCode).toEqual(404);
        });
    });

    describe('GET /api/grants/:grantId/applications', () => {
        it('should allow owner GRANTOR to view applications for their grant', async () => {
            const res = await request(app)
                .get(`/api/grants/${grantId}/applications`)
                .set('Authorization', `Bearer ${grantor1Token}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toEqual(1);
            expect(res.body[0]).toHaveProperty('id', applicationId);
        });

        it('should return 403 when non-owner GRANTOR attempts to view applications', async () => {
            const res = await request(app)
                .get(`/api/grants/${grantId}/applications`)
                .set('Authorization', `Bearer ${grantor2Token}`);

            expect(res.statusCode).toEqual(403);
        });
    });

    describe('GET /api/applications/:appId', () => {
        it('should allow submitting GRANTEE to view their application details', async () => {
            const res = await request(app)
                .get(`/api/applications/${applicationId}`)
                .set('Authorization', `Bearer ${grantee1Token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('id', applicationId);
        });

        it('should allow owner GRANTOR of parent grant to view application details', async () => {
            const res = await request(app)
                .get(`/api/applications/${applicationId}`)
                .set('Authorization', `Bearer ${grantor1Token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('id', applicationId);
        });

        it('should return 403 when an unauthorized GRANTEE attempts to view another grantee application', async () => {
            const res = await request(app)
                .get(`/api/applications/${applicationId}`)
                .set('Authorization', `Bearer ${grantee2Token}`);

            expect(res.statusCode).toEqual(403);
        });

        it('should return 404 for non-existent application ID', async () => {
            const res = await request(app)
                .get('/api/applications/00000000-0000-0000-0000-000000000999')
                .set('Authorization', `Bearer ${grantee1Token}`);

            expect(res.statusCode).toEqual(404);
        });
    });
});
