const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

describe('Auth API', () => {
    beforeAll(async () => {
        // Connect to MongoDB (Test Environment)
        // If getting "jest has detected open handles", it's likely Mongoose.
    });

    afterAll(async () => {
        await User.deleteMany({ email: 'test@example.com' }); // Cleanup
        await mongoose.connection.close();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new viewer', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    role: 'viewer'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.role).toBe('viewer');
        });

        it('should fail registration for existing user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User 2',
                    email: 'test@example.com', // Same email
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('User already exists');
        });

        it('should reject admin registration without secret', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Admin',
                    email: 'admin@example.com',
                    password: 'password123',
                    role: 'admin'
                });

            // Should be 403 or fallback to viewer? 
            // My implementation: Returns 403 Forbidden
            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toContain('Invalid Admin Secret');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should fail with invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
        });
    });
});
