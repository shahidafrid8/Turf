const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
    const client = await pool.connect();
    try {
        console.log("Inserting admin...");
        await client.query(
            `INSERT INTO admins (email, full_name) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING`,
            ["shaikmahammadshahidafrid@gmail.com", "Admin"]
        );
        const { rows } = await client.query("SELECT * FROM admins");
        console.log("✅ Admins table contents:");
        console.table(rows);
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch(e => { console.error(e); process.exit(1); });
