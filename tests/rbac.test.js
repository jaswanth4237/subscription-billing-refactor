const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const { generateToken } = require('../src/utils/jwt');

describe('Role-Based Access Control (RBAC) & User Management', () => {
    let granteeToken;
    let adminToken;
    let regularUserId;

    beforeEach(async () => {
        db.resetInMemoryStore();

        // Register a regular GRANTEE user
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Regular User',
                email: 'regular@example.com',
                password: 'Password123!'
            });

        regularUserId = regRes.body.id;

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'regular@example.com',
                password: 'Password123!'
            });

        granteeToken = loginRes.body.accessToken;

        // Login as default seeded admin user
        const adminLoginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@portal.com',
                password: 'AdminPassword123!'
            });

        adminToken = adminLoginRes.body.accessToken;
    });

    describe('401 Unauthorized Checks', () => {
        it('should return 401 when accessing protected endpoint without Authorization header', async () => {
            const res = await request(app).get('/api/grants');
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('error');
        });

        it('should return 401 when accessing protected endpoint with invalid token', async () => {
            const res = await request(app)
                .get('/api/grants')
                .set('Authorization', 'Bearer invalid_token_123');

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('403 Forbidden Checks', () => {
        it('should return 403 when GRANTEE attempts to access GRANTOR-only endpoint (POST /api/grants)', async () => {
            const res = await request(app)
                .post('/api/grants')
                .set('Authorization', `Bearer ${granteeToken}`)
                .send({
                    title: 'Forbidden Grant',
                    description: 'Should fail',
                    amount: 10000
                });

            expect(res.statusCode).toEqual(403);
            expect(res.body).toHaveProperty('error');
        });

        it('should return 403 when non-ADMIN attempts role assignment (POST /api/users/:id/roles)', async () => {
            const res = await request(app)
                .post(`/api/users/${regularUserId}/roles`)
                .set('Authorization', `Bearer ${granteeToken}`)
                .send({ roleName: 'GRANTOR' });

            expect(res.statusCode).toEqual(403);
        });
    });

    describe('Admin Role Assignment (POST /api/users/:userId/roles)', () => {
        it('should allow ADMIN to assign GRANTOR role to a user', async () => {
            const res = await request(app)
                .post(`/api/users/${regularUserId}/roles`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ roleName: 'GRANTOR' });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message');
            expect(res.body.user.roles).toContain('GRANTOR');
        });

        it('should return 404 if assigning role to non-existent user', async () => {
            const res = await request(app)
                .post('/api/users/00000000-0000-0000-0000-000000000999/roles')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ roleName: 'GRANTOR' });

            expect(res.statusCode).toEqual(404);
        });

        it('should return 400 if assigned role does not exist', async () => {
            const res = await request(app)
                .post(`/api/users/${regularUserId}/roles`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ roleName: 'INVALID_ROLE' });

            expect(res.statusCode).toEqual(400);
        });
    });
});
