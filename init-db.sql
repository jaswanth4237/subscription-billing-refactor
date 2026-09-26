-- PostgreSQL Database Schema & Seeding Script

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 3. UserRoles Join Table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 4. Grants Table
CREATE TABLE IF NOT EXISTS grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    grantor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grant_id UUID REFERENCES grants(id) ON DELETE CASCADE,
    grantee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    proposal TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Database Seeding: Roles
INSERT INTO roles (id, name) VALUES 
    (1, 'ADMIN'),
    (2, 'GRANTOR'),
    (3, 'GRANTEE')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Seed Default Admin User
-- Password for admin@portal.com is: AdminPassword123!
-- Bcrypt hash ($2a$10$wN1DkWJ2xV0yD.O7D8m2U.Wk5l8w4xKqNnZ9E4x1Qy6UvR.B3w9yS)
INSERT INTO users (id, name, email, password_hash)
VALUES ('00000000-0000-0000-0000-000000000001', 'System Administrator', 'admin@portal.com', '$2a$10$wN1DkWJ2xV0yD.O7D8m2U.Wk5l8w4xKqNnZ9E4x1Qy6UvR.B3w9yS')
ON CONFLICT (email) DO NOTHING;

-- Seed Default Admin User Role
INSERT INTO user_roles (user_id, role_id)
VALUES ('00000000-0000-0000-0000-000000000001', 1)
ON CONFLICT DO NOTHING;
