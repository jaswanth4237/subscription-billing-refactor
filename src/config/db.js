const { Pool } = require('pg');
const env = require('./env');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

let pool = null;
let useInMemory = false;

// In-Memory Storage for Fallback / Testing
const inMemoryData = {
    roles: [
        { id: 1, name: 'ADMIN' },
        { id: 2, name: 'GRANTOR' },
        { id: 3, name: 'GRANTEE' }
    ],
    users: [
        {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'System Administrator',
            email: 'admin@portal.com',
            password_hash: bcrypt.hashSync('AdminPassword123!', 10),
            oauth_provider: null,
            oauth_id: null,
            created_at: new Date(),
            updated_at: new Date()
        }
    ],
    user_roles: [
        { user_id: '00000000-0000-0000-0000-000000000001', role_id: 1 }
    ],
    grants: [],
    applications: []
};

if (process.env.NODE_ENV !== 'test') {
    pool = new Pool({
        connectionString: env.DATABASE_URL,
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME
    });

    pool.on('error', (err) => {
        console.warn('Unexpected DB pool error, falling back to in-memory mode:', err.message);
        useInMemory = true;
    });
} else {
    useInMemory = true;
}

async function initSchemaAndSeed() {
    if (useInMemory || !pool) return;
    try {
        const client = await pool.connect();
        try {
            await client.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_roles (
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            role_id INT REFERENCES roles(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, role_id)
        );

        CREATE TABLE IF NOT EXISTS grants (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            amount NUMERIC(12, 2) NOT NULL,
            grantor_id UUID REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS applications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            grant_id UUID REFERENCES grants(id) ON DELETE CASCADE,
            grantee_id UUID REFERENCES users(id) ON DELETE CASCADE,
            proposal TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'submitted',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO roles (id, name) VALUES 
            (1, 'ADMIN'),
            (2, 'GRANTOR'),
            (3, 'GRANTEE')
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

        INSERT INTO users (id, name, email, password_hash)
        VALUES ('00000000-0000-0000-0000-000000000001', 'System Administrator', 'admin@portal.com', '${bcrypt.hashSync('AdminPassword123!', 10)}')
        ON CONFLICT (email) DO NOTHING;

        INSERT INTO user_roles (user_id, role_id)
        VALUES ('00000000-0000-0000-0000-000000000001', 1)
        ON CONFLICT DO NOTHING;
      `);
        } finally {
            client.release();
        }
    } catch (err) {
        console.warn('Postgres connection failed on init. Switching to in-memory mode:', err.message);
        useInMemory = true;
    }
}

async function query(text, params = []) {
    if (!useInMemory && pool) {
        try {
            return await pool.query(text, params);
        } catch (err) {
            if (err.code === 'ECONNREFUSED' || err.message.includes('connect')) {
                console.warn('Postgres connection issue. Using in-memory store for query.');
                useInMemory = true;
            } else {
                throw err;
            }
        }
    }

    // In-Memory Query Simulator for testing & fallback
    return executeInMemoryQuery(text, params);
}

function executeInMemoryQuery(text, params) {
    const normalizedText = text.replace(/\s+/g, ' ').trim();

    // --- USERS TABLE ---
    if (normalizedText.startsWith('SELECT') && normalizedText.includes('FROM users')) {
        if (normalizedText.includes('WHERE email =')) {
            const email = params[0];
            const rows = inMemoryData.users.filter(u => u.email.toLowerCase() === email.toLowerCase());
            return { rows, rowCount: rows.length };
        }
        if (normalizedText.includes('WHERE id =')) {
            const id = params[0];
            const rows = inMemoryData.users.filter(u => u.id === id);
            return { rows, rowCount: rows.length };
        }
        if (normalizedText.includes('WHERE oauth_provider =')) {
            const provider = params[0];
            const oauthId = params[1];
            const rows = inMemoryData.users.filter(u => u.oauth_provider === provider && u.oauth_id === oauthId);
            return { rows, rowCount: rows.length };
        }
        return { rows: [...inMemoryData.users], rowCount: inMemoryData.users.length };
    }

    if (normalizedText.startsWith('INSERT INTO users')) {
        const columnsPart = normalizedText.split(/VALUES/i)[0];
        const hasExplicitId = columnsPart.includes('(id,') || columnsPart.includes('(id ');
        let id, name, email, password_hash, oauth_provider, oauth_id;

        if (hasExplicitId) {
            id = params[0];
            name = params[1];
            email = params[2];
            password_hash = params[3];
            oauth_provider = params[4] || null;
            oauth_id = params[5] || null;
        } else {
            id = uuidv4();
            name = params[0];
            email = params[1];
            password_hash = params[2];
            oauth_provider = params[3] || null;
            oauth_id = params[4] || null;
        }

        const newUser = {
            id,
            name,
            email,
            password_hash,
            oauth_provider,
            oauth_id,
            created_at: new Date(),
            updated_at: new Date()
        };
        inMemoryData.users.push(newUser);
        return { rows: [newUser], rowCount: 1 };
    }

    // --- USER_ROLES TABLE ---
    if (normalizedText.includes('FROM user_roles') || normalizedText.includes('JOIN user_roles')) {
        if (normalizedText.includes('WHERE user_id =') || normalizedText.includes('ur.user_id =')) {
            const userId = params[0];
            const userRoleEntries = inMemoryData.user_roles.filter(ur => ur.user_id === userId);
            const rows = userRoleEntries.map(ur => {
                const roleObj = inMemoryData.roles.find(r => r.id === ur.role_id);
                return {
                    user_id: ur.user_id,
                    role_id: ur.role_id,
                    name: roleObj ? roleObj.name : 'GRANTEE',
                    role_name: roleObj ? roleObj.name : 'GRANTEE'
                };
            });
            return { rows, rowCount: rows.length };
        }
    }

    if (normalizedText.startsWith('INSERT INTO user_roles')) {
        const userId = params[0];
        const roleId = parseInt(params[1], 10);
        const exists = inMemoryData.user_roles.some(ur => ur.user_id === userId && ur.role_id === roleId);
        if (!exists) {
            inMemoryData.user_roles.push({ user_id: userId, role_id: roleId });
        }
        return { rows: [{ user_id: userId, role_id: roleId }], rowCount: 1 };
    }

    if (normalizedText.startsWith('DELETE FROM user_roles')) {
        const userId = params[0];
        inMemoryData.user_roles = inMemoryData.user_roles.filter(ur => ur.user_id !== userId);
        return { rows: [], rowCount: 1 };
    }

    // --- ROLES TABLE ---
    if (normalizedText.startsWith('SELECT') && normalizedText.includes('FROM roles') && !normalizedText.includes('user_roles')) {
        if (normalizedText.includes('WHERE name =')) {
            const name = String(params[0]).toUpperCase();
            const rows = inMemoryData.roles.filter(r => r.name.toUpperCase() === name);
            return { rows: rows.map(r => ({ ...r })), rowCount: rows.length };
        }
        if (normalizedText.includes('WHERE id =')) {
            const id = parseInt(params[0], 10);
            const rows = inMemoryData.roles.filter(r => r.id === id);
            return { rows: rows.map(r => ({ ...r })), rowCount: rows.length };
        }
        return { rows: inMemoryData.roles.map(r => ({ ...r })), rowCount: inMemoryData.roles.length };
    }

    if (normalizedText.startsWith('INSERT INTO user_roles')) {
        const userId = params[0];
        const roleId = parseInt(params[1], 10);
        const exists = inMemoryData.user_roles.some(ur => ur.user_id === userId && ur.role_id === roleId);
        if (!exists) {
            inMemoryData.user_roles.push({ user_id: userId, role_id: roleId });
        }
        return { rows: [{ user_id: userId, role_id: roleId }], rowCount: 1 };
    }

    if (normalizedText.startsWith('DELETE FROM user_roles')) {
        const userId = params[0];
        inMemoryData.user_roles = inMemoryData.user_roles.filter(ur => ur.user_id !== userId);
        return { rows: [], rowCount: 1 };
    }

    // --- GRANTS TABLE ---
    if (normalizedText.startsWith('SELECT') && normalizedText.includes('FROM grants')) {
        if (normalizedText.includes('WHERE id =')) {
            const id = params[0];
            const rows = inMemoryData.grants.filter(g => g.id === id);
            return { rows, rowCount: rows.length };
        }
        if (normalizedText.includes('WHERE grantor_id =')) {
            const grantorId = params[0];
            const rows = inMemoryData.grants.filter(g => g.grantor_id === grantorId);
            return { rows, rowCount: rows.length };
        }
        return { rows: [...inMemoryData.grants], rowCount: inMemoryData.grants.length };
    }

    if (normalizedText.startsWith('INSERT INTO grants')) {
        const newGrant = {
            id: uuidv4(),
            title: params[0],
            description: params[1],
            amount: parseFloat(params[2]),
            grantor_id: params[3],
            created_at: new Date(),
            updated_at: new Date()
        };
        inMemoryData.grants.push(newGrant);
        return { rows: [newGrant], rowCount: 1 };
    }

    if (normalizedText.startsWith('UPDATE grants')) {
        const title = params[0];
        const description = params[1];
        const amount = parseFloat(params[2]);
        const id = params[3];
        const grant = inMemoryData.grants.find(g => g.id === id);
        if (grant) {
            grant.title = title;
            grant.description = description;
            grant.amount = amount;
            grant.updated_at = new Date();
            return { rows: [grant], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    if (normalizedText.startsWith('DELETE FROM grants')) {
        const id = params[0];
        const initialLen = inMemoryData.grants.length;
        inMemoryData.grants = inMemoryData.grants.filter(g => g.id !== id);
        return { rows: [], rowCount: initialLen - inMemoryData.grants.length };
    }

    // --- APPLICATIONS TABLE ---
    if (normalizedText.startsWith('SELECT') && normalizedText.includes('FROM applications')) {
        if (normalizedText.includes('WHERE id =')) {
            const id = params[0];
            const rows = inMemoryData.applications.filter(a => a.id === id);
            return { rows, rowCount: rows.length };
        }
        if (normalizedText.includes('WHERE grant_id =')) {
            const grantId = params[0];
            const rows = inMemoryData.applications.filter(a => a.grant_id === grantId);
            return { rows, rowCount: rows.length };
        }
        if (normalizedText.includes('WHERE grantee_id =')) {
            const granteeId = params[0];
            const rows = inMemoryData.applications.filter(a => a.grantee_id === granteeId);
            return { rows, rowCount: rows.length };
        }
        return { rows: [...inMemoryData.applications], rowCount: inMemoryData.applications.length };
    }

    if (normalizedText.startsWith('INSERT INTO applications')) {
        const newApp = {
            id: uuidv4(),
            grant_id: params[0],
            grantee_id: params[1],
            proposal: params[2],
            status: params[3] || 'submitted',
            created_at: new Date(),
            updated_at: new Date()
        };
        inMemoryData.applications.push(newApp);
        return { rows: [newApp], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
}

function resetInMemoryStore() {
    inMemoryData.users = [
        {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'System Administrator',
            email: 'admin@portal.com',
            password_hash: bcrypt.hashSync('AdminPassword123!', 10),
            oauth_provider: null,
            oauth_id: null,
            created_at: new Date(),
            updated_at: new Date()
        }
    ];
    inMemoryData.user_roles = [
        { user_id: '00000000-0000-0000-0000-000000000001', role_id: 1 }
    ];
    inMemoryData.grants = [];
    inMemoryData.applications = [];
}

module.exports = {
    query,
    pool,
    initSchemaAndSeed,
    resetInMemoryStore,
    inMemoryData
};
