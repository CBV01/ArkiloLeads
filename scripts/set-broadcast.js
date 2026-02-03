const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url, authToken });

async function setBroadcast() {
    const msg = "DEBUG MESSAGE: System is working!";
    await db.execute({
        sql: "UPDATE settings SET value = ? WHERE key = 'global_broadcast_message'",
        args: [msg]
    });
    console.log('Broadcast message set to:', msg);
}

setBroadcast();
