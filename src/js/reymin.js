"use strict";

const API = "https://myportfolio-backend-v667.onrender.com";

// Token'ı tarayıcı hafızasında tut (sayfa yenilense de kalsın)
let token = localStorage.getItem("admin-token");

const loginBox = document.getElementById("loginBox");
const panel = document.getElementById("panel");

// Sayfa açılınca: token varsa paneli göster
if (token) showPanel();

/* GİRİŞ */
document.getElementById("loginBtn").addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const status = document.getElementById("loginStatus");

    try {
        const res = await fetch(API + "/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Giriş başarısız.");

        token = data.token;
        localStorage.setItem("admin-token", token);
        showPanel();
    } catch (err) {
        status.textContent = err.message;
        status.className = "admin-status error";
    }
});

/* ÇIKIŞ */
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("admin-token");
    token = null;
    panel.classList.add("hidden");
    loginBox.classList.remove("hidden");
});

/* PANELİ GÖSTER + VERİLERİ YÜKLE */
function showPanel() {
    loginBox.classList.add("hidden");
    panel.classList.remove("hidden");
    loadProjects();
    loadMessages();
}

/* PROJELERİ YÜKLE */
async function loadProjects() {
    const list = document.getElementById("projectList");
    const res = await fetch(API + "/api/projects");
    const data = await res.json();
    list.innerHTML = "";
    (data.projects || []).forEach(p => {
        const div = document.createElement("div");
        div.className = "proj-item";
        div.innerHTML = `<span><strong>${p.title}</strong></span>`;

        const btnWrap = document.createElement("span");

        const editBtn = document.createElement("button");
        editBtn.className = "admin-btn";
        editBtn.textContent = "Düzenle";
        editBtn.style.marginRight = "8px";
        editBtn.addEventListener("click", () => startEdit(p));

        const delBtn = document.createElement("button");
        delBtn.className = "admin-btn admin-btn-danger";
        delBtn.textContent = "Sil";
        delBtn.addEventListener("click", () => deleteProject(p.id));

        btnWrap.appendChild(editBtn);
        btnWrap.appendChild(delBtn);
        div.appendChild(btnWrap);
        list.appendChild(div);
    });
}

/* EKLE ya da GÜNCELLE (aynı form) */
let editingId = null;   // null = ekleme modu, sayı = o id'yi düzenleme modu

document.getElementById("addProjectBtn").addEventListener("click", async () => {
    const status = document.getElementById("projectStatus");
    const body = {
        title: document.getElementById("p-title").value.trim(),
        description: document.getElementById("p-desc").value.trim(),
        image_url: document.getElementById("p-image").value.trim(),
        github_url: document.getElementById("p-github").value.trim()
    };

    // Düzenleme modundaysak PUT, değilsek POST
    const url = editingId ? API + "/api/projects/" + editingId : API + "/api/projects";
    const method = editingId ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "İşlem başarısız.");

        status.textContent = editingId ? "Proje güncellendi." : "Proje eklendi.";
        status.className = "admin-status success";
        cancelEdit();       // formu temizle + ekleme moduna dön
        loadProjects();
    } catch (err) {
        status.textContent = err.message;
        status.className = "admin-status error";
    }
});

/* DÜZENLEMEYE BAŞLA: alanları doldur, modu değiştir */
function startEdit(p) {
    editingId = p.id;
    document.getElementById("p-title").value = p.title || "";
    document.getElementById("p-desc").value = p.description || "";
    document.getElementById("p-image").value = p.image_url || "";
    document.getElementById("p-github").value = p.github_url || "";
    document.getElementById("addProjectBtn").textContent = "Güncelle";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* DÜZENLEMEYİ İPTAL ET / FORMU TEMİZLE */
function cancelEdit() {
    editingId = null;
    document.getElementById("p-title").value = "";
    document.getElementById("p-desc").value = "";
    document.getElementById("p-image").value = "";
    document.getElementById("p-github").value = "";
    document.getElementById("addProjectBtn").textContent = "Ekle";
}

/* PROJE SİL */
async function deleteProject(id) {
    if (!confirm("Bu projeyi silmek istediğine emin misin?")) return;
    const res = await fetch(API + "/api/projects/" + id, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
    if (res.ok) loadProjects();
}

/* MESAJLARI YÜKLE */
async function loadMessages() {
    const list = document.getElementById("messageList");
    const res = await fetch(API + "/api/messages", {
        headers: { "Authorization": "Bearer " + token }
    });
    if (!res.ok) { list.textContent = "Mesajlar yüklenemedi."; return; }
    const data = await res.json();
    list.innerHTML = "";
    (data.messages || []).forEach(m => {
        const div = document.createElement("div");
        div.className = "msg-item";
        div.innerHTML = `<strong>${m.name}</strong> — ${m.email}
            <div>${m.message}</div>
            <div class="msg-meta">${new Date(m.created_at).toLocaleString("tr-TR")}</div>`;
        list.appendChild(div);
    });
}
