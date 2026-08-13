require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query("SELECT NOW()")
    .then(res => {
        console.log("✅ Bağlantı başarılı! Sunucu saati:", res.rows[0].now);
        pool.end();
    })
    .catch(err => {
        console.error("❌ Bağlantı hatası:", err.message);
        pool.end();
    });
