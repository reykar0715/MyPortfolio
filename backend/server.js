require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

// Veritabanı bağlantısı
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Test ucu
app.get("/", (req, res) => {
    res.json({ message: "Backend çalışıyor 🎉" });
});

// MESAJ KAYDET
app.post("/api/messages", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "Tüm alanlar zorunludur." });
        }

        await pool.query(
            "INSERT INTO messages (name, email, message) VALUES ($1, $2, $3)",
            [name, email, message]
        );

        res.status(201).json({ message: "Mesaj kaydedildi." });
    } catch (err) {
        console.error("Mesaj kaydı hatası:", err.message);
        res.status(500).json({ error: "Sunucu hatası." });
    }
});

// ADMIN GİRİŞİ
app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Kullanıcı adı ve şifre gerekli." });
        }

        const result = await pool.query(
            "SELECT * FROM admins WHERE username = $1",
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı." });
        }

        const admin = result.rows[0];
        const valid = await bcrypt.compare(password, admin.password_hash);

        if (!valid) {
            return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı." });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: "12h" }
        );

        res.json({ token });
    } catch (err) {
        console.error("Giriş hatası:", err.message);
        res.status(500).json({ error: "Sunucu hatası." });
    }
});

// KORUMA KATMANI: geçerli token yoksa geçme
function auth(req, res, next) {
    const header = req.headers.authorization;

    // "Bearer <token>" formatında mı?
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Yetkisiz erişim." });
    }

    const token = header.split(" ")[1];

    try {
        // Token'ı doğrula (imza + süre kontrolü)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;   // admin bilgisini isteğe ekle
        next();                // her şey tamam, devam et
    } catch (err) {
        return res.status(401).json({ error: "Geçersiz veya süresi dolmuş oturum." });
    }
}

// MESAJLARI LİSTELE (sadece admin)
app.get("/api/messages", auth, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM messages ORDER BY created_at DESC"
        );
        res.json({ messages: result.rows });
    } catch (err) {
        console.error("Mesaj listeleme hatası:", err.message);
        res.status(500).json({ error: "Sunucu hatası." });
    }
});

// PROJE EKLE (sadece admin)
app.post("/api/projects", auth, async (req, res) => {
    try {
        const { title, description, image_url, github_url } = req.body;

        if (!title) {
            return res.status(400).json({ error: "Başlık zorunludur." });
        }

        const result = await pool.query(
            "INSERT INTO projects (title, description, image_url, github_url) VALUES ($1, $2, $3, $4) RETURNING *",
            [title, description, image_url, github_url]
        );

        res.status(201).json({ project: result.rows[0] });
    } catch (err) {
        console.error("Proje ekleme hatası:", err.message);
        res.status(500).json({ error: "Sunucu hatası." });
    }
});

// PROJE SİL (sadece admin)
app.delete("/api/projects/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM projects WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Proje bulunamadı." });
        }

        res.json({ message: "Proje silindi." });
    } catch (err) {
        console.error("Proje silme hatası:", err.message);
        res.status(500).json({ error: "Sunucu hatası." });
    }
});

// PROJE GÜNCELLE (sadece admin)
app.put("/api/projects/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, image_url, github_url } = req.body;

        if (!title) {
            return res.status(400).json({ error: "Başlık zorunludur." });
        }

        const result = await pool.query(
            "UPDATE projects SET title = $1, description = $2, image_url = $3, github_url = $4 WHERE id = $5 RETURNING *",
            [title, description, image_url, github_url, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Proje bulunamadı." });
        }

        res.json({ project: result.rows[0] });
    } catch (err) {
        console.error("Proje güncelleme hatası:", err.message);
        res.status(500).json({ error: "Sunucu hatası." });
    }
});

// PROJELERİ LİSTELE (herkese açık — site bunu gösterecek)
app.get("/api/projects", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM projects ORDER BY created_at DESC"
        );
        res.json({ projects: result.rows });
    } catch (err) {
        console.error("Proje listeleme hatası:", err.message);
        res.status(500).json({ error: "Sunucu hatası." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`);
});