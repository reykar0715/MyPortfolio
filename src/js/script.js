"use strict";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ===========================
   TEMA (AÇIK / KOYU)
=========================== */
(function themeModule() {
    const root = document.documentElement;
    const toggle = document.getElementById("themeToggle");
    if (!toggle) return;

    const STORAGE_KEY = "portfolio-theme";
    const stored = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(stored || (prefersDark ? "dark" : "light"));

    toggle.addEventListener("click", () => {
        const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
    });

    function applyTheme(theme) {
        if (theme === "dark") root.setAttribute("data-theme", "dark");
        else root.removeAttribute("data-theme");
        toggle.setAttribute("aria-pressed", String(theme === "dark"));
    }
})();

/* ===========================
   MOBİL NAVİGASYON
=========================== */
(function mobileNavModule() {
    const navToggle = document.getElementById("navToggle");
    const navLinks = document.getElementById("navLinks");
    if (!navToggle || !navLinks) return;

    navToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        navToggle.classList.toggle("open", isOpen);
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("open");
            navToggle.classList.remove("open");
            navToggle.setAttribute("aria-expanded", "false");
        });
    });
})();

/* ===========================
   SCROLL: PROGRESS + AKTİF LINK + BACK-TO-TOP
=========================== */
(function scrollModule() {
    const progress = document.getElementById("scrollProgress");
    const backToTop = document.getElementById("backToTop");
    const navLinkEls = document.querySelectorAll(".nav-link");
    const sections = [...navLinkEls]
        .map(a => document.querySelector(a.getAttribute("href")))
        .filter(Boolean);

    let ticking = false;

    function update() {
        ticking = false;
        const doc = document.documentElement;
        const scrollTop = window.scrollY;
        const max = doc.scrollHeight - doc.clientHeight;
        const pct = max > 0 ? (scrollTop / max) * 100 : 0;
        if (progress) progress.style.width = pct + "%";
        if (backToTop) backToTop.classList.toggle("visible", scrollTop > 500);
    }

    window.addEventListener("scroll", () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();

    if (backToTop) {
        backToTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });
    }

    if (sections.length) {
        const activeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const id = "#" + entry.target.id;
                navLinkEls.forEach(link => {
                    link.classList.toggle("active", link.getAttribute("href") === id);
                });
            });
        }, { threshold: 0.4, rootMargin: "-90px 0px -50% 0px" });
        sections.forEach(sec => activeObserver.observe(sec));
    }
})();

/* ===========================
   MIKNATIS BUTONLAR
=========================== */
(function magneticModule() {
    if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;
    document.querySelectorAll(".magnetic").forEach(btn => {
        btn.addEventListener("mousemove", (e) => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top - r.height / 2;
            btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
        });
        btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
})();

/* ===========================
   TİLKİ SCROLL ANİMASYONU
=========================== */
(function foxModule() {
    const fox = document.getElementById("fox");
    const foxImg = document.getElementById("fox-img");
    const blocks = document.querySelectorAll(".about-block");
    const aboutSec = document.getElementById("about");
    const heroSec = document.getElementById("hero");
    const profile = document.querySelector(".profile-frame");
    if (!fox || !foxImg || !blocks.length || !aboutSec) return;

    const FOX_H = 220;

    const F = {
        sitLeft: "images/fox/fox-06-otur-sol.png",
        lieLeft: "images/fox/fox-01-yat-sol.png",
        jumpRight: ["images/fox/fox-09-zipla-sag1.png", "images/fox/fox-10-zipla-sag2.png", "images/fox/fox-11-inis-sag.png"],
        jumpLeft: ["images/fox/fox-03-zipla-sol1.png", "images/fox/fox-04-zipla-sol2.png", "images/fox/fox-05-inis-sol.png"]
    };

    [F.sitLeft, F.lieLeft, ...F.jumpRight, ...F.jumpLeft].forEach(src => { const img = new Image(); img.src = src; });

    function stateFor(i) {
        const paragrafSagda = (i % 2 === 0);
        return { foxSide: paragrafSagda ? "left" : "right", facing: paragrafSagda ? "right" : "left", rest: (i === blocks.length - 1) ? "lie" : "sit" };
    }
    function placeX(side) { return side === "left" ? "3%" : "calc(97% - " + fox.offsetWidth + "px)"; }
    function placeY(i) { const b = blocks[i]; return (b.offsetTop + b.offsetHeight / 2 - FOX_H / 2) + "px"; }
    function homePos() {
        const pr = profile.getBoundingClientRect();
        const ar = aboutSec.getBoundingClientRect();
        return { top: (pr.bottom - ar.top) - 25, left: (pr.left + pr.width / 2 - ar.left) - fox.offsetWidth / 2 };
    }
    function setRest(st) {
        foxImg.classList.toggle("flip", st.facing === "right");
        foxImg.src = (st.rest === "lie") ? F.lieLeft : F.sitLeft;
    }
    function playFrames(frames, done) {
        if (reduceMotion) { done(); return; }
        foxImg.classList.remove("flip");
        foxImg.src = frames[0];
        fox.classList.remove("hop");
        void fox.offsetWidth;
        fox.classList.add("hop");
        let k = 0;
        const iv = setInterval(() => {
            k++;
            if (k < frames.length) foxImg.src = frames[k];
            else { clearInterval(iv); fox.classList.remove("hop"); done(); }
        }, 200);
    }

    let current = -1;

    function goTo(i) {
        const st = stateFor(i);
        fox.style.left = placeX(st.foxSide);
        fox.style.top = placeY(i);
        playFrames((st.foxSide === "right") ? F.jumpRight : F.jumpLeft, () => setRest(st));
    }
    function goHome() {
        if (!profile) return;
        const h = homePos();
        fox.style.left = h.left + "px";
        fox.style.top = h.top + "px";
        playFrames(F.jumpRight, () => { foxImg.src = F.lieLeft; foxImg.classList.remove("flip"); });
    }

    if (profile) {
        const h = homePos();
        fox.style.left = h.left + "px";
        fox.style.top = h.top + "px";
        foxImg.src = F.lieLeft;
        foxImg.classList.remove("flip");
        fox.classList.add("visible");
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            const i = [...blocks].indexOf(e.target);
            if (i === current) return;
            fox.classList.add("visible");
            goTo(i);
            current = i;
        });
    }, { threshold: 0.5, rootMargin: "-25% 0px -25% 0px" });
    blocks.forEach(b => io.observe(b));

    if (heroSec) {
        const ioHero = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && current !== -1) { current = -1; goHome(); }
        }, { threshold: 0.6 });
        ioHero.observe(heroSec);
    }

    window.addEventListener("resize", () => {
        if (current === -1) {
            if (!profile) return;
            const h = homePos();
            fox.style.left = h.left + "px";
            fox.style.top = h.top + "px";
        } else {
            const st = stateFor(current);
            fox.style.left = placeX(st.foxSide);
            fox.style.top = placeY(current);
        }
    });
})();

/* ===========================
   PROJELERİ BACKEND'DEN ÇEK + CAROUSEL
=========================== */
(function projectsModule() {
    const track = document.querySelector(".carousel-track");
    if (!track) return;

    const API = "http://localhost:3000";   // Vercel'de değişecek

    // Projeleri çek
    fetch(API + "/api/projects")
        .then(res => res.json())
        .then(data => {
            const projects = data.projects || [];

            if (projects.length === 0) {
                track.innerHTML = '<p style="padding:40px;color:var(--color-text-soft)">Henüz proje eklenmedi.</p>';
                return;
            }

            // Her proje için kart oluştur
            track.innerHTML = projects.map(p => `
                <a href="${p.github_url || '#'}" target="_blank" rel="noopener" class="project-card">
                    <div class="project-card-media">
                        <img src="${p.image_url || ''}" alt="${p.title}" loading="lazy">
                    </div>
                    <div class="project-card-body">
                        <span class="project-title">${p.title}</span>
                        <span class="project-desc">${p.description || ''}</span>
                    </div>
                </a>
            `).join("");

            // Kartlar hazır, şimdi carousel'i başlat
            initCarousel();
        })
        .catch(err => {
            console.error("Projeler yüklenemedi:", err);
            track.innerHTML = '<p style="padding:40px;color:var(--color-text-soft)">Projeler yüklenemedi.</p>';
        });
})();

/* ===========================
   CAROUSEL (projeler yüklendikten sonra çağrılır)
=========================== */
function initCarousel() {
    const track = document.querySelector(".carousel-track");
    const prev = document.querySelector(".carousel-btn.prev");
    const next = document.querySelector(".carousel-btn.next");
    if (!track || track.children.length === 0) return;

    const originals = [...track.children];
    for (let n = 0; n < 2; n++) originals.forEach(c => track.appendChild(c.cloneNode(true)));

    let setWidth = 0, offset = 0;
    const step = 324;

    function apply(smooth) {
        track.style.transition = smooth ? "transform 0.45s ease" : "none";
        track.style.transform = "translateX(" + offset + "px)";
    }
    function normalize() {
        let changed = false;
        while (offset <= -setWidth * 2) { offset += setWidth; changed = true; }
        while (offset >= 0) { offset -= setWidth; changed = true; }
        if (changed) apply(false);
    }
    function measure() { setWidth = track.scrollWidth / 3; offset = -setWidth; apply(false); }
    measure();
    window.addEventListener("load", measure);

    if (next) next.addEventListener("click", () => { offset -= step; apply(true); });
    if (prev) prev.addEventListener("click", () => { offset += step; apply(true); });
    track.addEventListener("transitionend", normalize);

    track.addEventListener("wheel", (e) => {
        if (e.deltaY === 0) return;
        e.preventDefault();
        offset -= e.deltaY;
        apply(false);
        normalize();
    }, { passive: false });

    let isDown = false, startX, startOffset, moved = 0;
    track.addEventListener("pointerdown", (e) => {
        isDown = true; moved = 0;
        track.classList.add("dragging");
        startX = e.clientX; startOffset = offset;
        track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointermove", (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        moved = Math.abs(dx);
        offset = startOffset + dx;
        apply(false);
    });
    function endDrag() {
        if (!isDown) return;
        isDown = false;
        track.classList.remove("dragging");
        normalize();
    }
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);

    track.addEventListener("click", (e) => {
        if (moved > 5) { e.preventDefault(); e.stopPropagation(); }
    }, true);
}

/* ===========================
   PROJE KARTI 3D TILT
=========================== */
(function tiltModule() {
    if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;
    document.querySelectorAll(".project-card").forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = `rotateX(${py * -8}deg) rotateY(${px * 8}deg) translateY(-4px)`;
        });
        card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
})();

/* ===========================
   SCROLL-REVEAL
=========================== */
(function revealModule() {
    const scopes = document.querySelectorAll("#about, #skills, #projects, #contact");
    scopes.forEach(scope => {
        scope.querySelectorAll("h2, .section-subtitle, h3, p, .about-block, .skill-card, .project-card, .about-link, .contact-card, .contact-form")
            .forEach(el => el.classList.add("reveal"));
    });

    const revealEls = document.querySelectorAll(".reveal");
    if (!revealEls.length) return;

    if (reduceMotion) { revealEls.forEach(el => el.classList.add("in-view")); return; }

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add("in-view"); obs.unobserve(e.target); }
        });
    }, { threshold: 0.15 });

    revealEls.forEach((el, i) => {
        el.style.transitionDelay = (Math.min(i % 4, 3) * 90) + "ms";
        obs.observe(el);
    });
})();

/* ===========================
   İLETİŞİM FORMU (BACKEND'E KAYDET)
=========================== */
(function contactFormModule() {
    const form = document.getElementById("contactForm");
    const statusEl = document.getElementById("contactStatus");
    const submitBtn = document.getElementById("contactSubmit");
    if (!form) return;

    const API = "http://localhost:3000";   // ileride Vercel adresiyle değişecek

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("cf-name").value.trim();
        const email = document.getElementById("cf-email").value.trim();
        const message = document.getElementById("cf-message").value.trim();

        if (!name || !email || !message) {
            statusEl.textContent = "Lütfen tüm alanları doldurun.";
            statusEl.className = "form-status error";
            return;
        }

        submitBtn.disabled = true;
        statusEl.textContent = "Gönderiliyor…";
        statusEl.className = "form-status";

        try {
            const res = await fetch(API + "/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message })
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.error || "Mesaj gönderilemedi.");
            }

            form.reset();
            statusEl.textContent = "Mesajınız gönderildi, teşekkürler!";
            statusEl.className = "form-status success";
        } catch (err) {
            statusEl.textContent = err.message || "Bir hata oluştu, tekrar deneyin.";
            statusEl.className = "form-status error";
        } finally {
            submitBtn.disabled = false;
        }
    });
})();