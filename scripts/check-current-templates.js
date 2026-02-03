const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function check() {
    try {
        const result = await db.execute('SELECT id, name, body FROM templates');
        console.log(JSON.stringify(result.rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
