const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function checkBroadcast() {
    const result = await db.execute("SELECT * FROM settings WHERE key = 'global_broadcast_message'");
    console.log('Broadcast Message in DB:', result.rows);
}

checkBroadcast();
