require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// BURAYA kendi admin bilgilerini yaz:

async function createAdmin() {
    try {
        // Şifreyi hash'le (10 = güvenlik turu sayısı)
        const hash = await bcrypt.hash(plainPassword, 10);

        await pool.query(
            "INSERT INTO admins (username, password_hash) VALUES ($1, $2)",
            [username, hash]
        );

        console.log("✅ Admin oluşturuldu:", username);
    } catch (err) {
        console.error("❌ Hata:", err.message);
    } finally {
        pool.end();
    }
}

createAdmin();