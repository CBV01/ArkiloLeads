const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url: url,
    authToken: authToken,
});

async function makeAdmin() {
    const email = process.argv[2];
    if (!email) {
        console.log('Usage: node scripts/make-admin.js <email>');
        process.exit(1);
    }

    try {
        const res = await db.execute({
            sql: "UPDATE users SET role = 'admin' WHERE email = ?",
            args: [email]
        });

        if (res.rowsAffected > 0) {
            console.log(`Success: ${email} is now an admin.`);
        } else {
            console.log(`Error: User with email ${email} not found.`);
        }
    } catch (e) {
        console.error(e);
    }
}

makeAdmin();
