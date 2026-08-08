/* ===========================
   TİLKİ SCROLL ANİMASYONU
=========================== */

(function () {
    const fox = document.getElementById("fox");
    const foxImg = document.getElementById("fox-img");
    const blocks = document.querySelectorAll(".about-block");
    const aboutSec = document.getElementById("about");
    const heroSec = document.getElementById("hero");
    const profile = document.querySelector(".profile-frame");
    if (!fox || !foxImg || !blocks.length || !aboutSec) return;

    const FOX_H = 220;   // CSS'teki #fox height ile AYNI olmalı
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const F = {
        sitLeft: "images/fox/fox-06-otur-sol.png",
        lieLeft: "images/fox/fox-01-yat-sol.png",
        jumpRight: [
            "images/fox/fox-09-zipla-sag1.png",
            "images/fox/fox-10-zipla-sag2.png",
            "images/fox/fox-11-inis-sag.png"
        ],
        jumpLeft: [
            "images/fox/fox-03-zipla-sol1.png",
            "images/fox/fox-04-zipla-sol2.png",
            "images/fox/fox-05-inis-sol.png"
        ]
    };

    [F.sitLeft, F.lieLeft, ...F.jumpRight, ...F.jumpLeft].forEach(src => {
        const img = new Image();
        img.src = src;
    });

    function stateFor(i) {
        const paragrafSagda = (i % 2 === 0);
        const foxSide = paragrafSagda ? "left" : "right";
        const facing = paragrafSagda ? "right" : "left";
        const sonBlok = (i === blocks.length - 1);
        return { foxSide, facing, rest: sonBlok ? "lie" : "sit" };
    }

    function placeX(side) {
        return side === "left" ? "3%" : "calc(97% - " + fox.offsetWidth + "px)";
    }

    function placeY(i) {
        const b = blocks[i];
        return (b.offsetTop + b.offsetHeight / 2 - FOX_H / 2) + "px";
    }

    // Profil fotoğrafının altındaki başlangıç konumu (about'a göre)
    function homePos() {
        const pr = profile.getBoundingClientRect();
        const ar = aboutSec.getBoundingClientRect();
        return {
            top: (pr.bottom - ar.top),                                  // fotoğrafın 20px altı
            left: (pr.left + pr.width / 2 - ar.left) - fox.offsetWidth / 2   // fotoğrafın altında ortalı
        };
    }

    function setRest(st) {
        foxImg.classList.toggle("flip", st.facing === "right");
        foxImg.src = (st.rest === "lie") ? F.lieLeft : F.sitLeft;
    }

    function playFrames(frames, done) {
        if (reduce) { done(); return; }
        foxImg.classList.remove("flip");
        foxImg.src = frames[0];
        fox.classList.remove("hop");
        void fox.offsetWidth;          // reflow: hop animasyonu yeniden tetiklensin
        fox.classList.add("hop");
        let k = 0;
        const iv = setInterval(() => {
            k++;
            if (k < frames.length) {
                foxImg.src = frames[k];
            } else {
                clearInterval(iv);
                fox.classList.remove("hop");
                done();
            }
        }, 200);
    }

    let current = -1;   // -1 = profil altında (hero başlangıcı)

    function goTo(i) {
        const st = stateFor(i);
        fox.style.left = placeX(st.foxSide);
        fox.style.top = placeY(i);
        const frames = (st.foxSide === "right") ? F.jumpRight : F.jumpLeft;
        playFrames(frames, () => setRest(st));
    }

    function goHome() {
        if (!profile) return;
        const h = homePos();
        fox.style.left = h.left + "px";
        fox.style.top = h.top + "px";
        // yukarı-sağa gidiyor (profil sağda) → sağ zıplama
        playFrames(F.jumpRight, () => {
            foxImg.src = F.lieLeft;
            foxImg.classList.remove("flip");
        });
    }

    // Başlangıç: profil fotoğrafının altında yat
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

    // Hero'ya geri dönünce profil altına dön
    if (heroSec) {
        const ioHero = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && current !== -1) {
                current = -1;
                goHome();
            }
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
   PROJE CAROUSEL (TRANSFORM TABANLI)
=========================== */

(function () {
    const track = document.querySelector(".carousel-track");
    const prev = document.querySelector(".carousel-btn.prev");
    const next = document.querySelector(".carousel-btn.next");
    if (!track) return;

    // Kartları 3 katına çıkar (sonsuz döngü için)
    const originals = [...track.children];
    for (let n = 0; n < 2; n++) {
        originals.forEach(c => track.appendChild(c.cloneNode(true)));
    }

    let setWidth = 0;
    let offset = 0;
    const step = 324;   // kart (300) + boşluk (24)

    function apply(smooth) {
        track.style.transition = smooth ? "transform 0.45s ease" : "none";
        track.style.transform = "translateX(" + offset + "px)";
    }

    // Ortadaki set aralığına görünmez şekilde geri sar
    function normalize() {
        let changed = false;
        while (offset <= -setWidth * 2) { offset += setWidth; changed = true; }
        while (offset >= 0) { offset -= setWidth; changed = true; }
        if (changed) apply(false);
    }

    function measure() {
        setWidth = track.scrollWidth / 3;
        offset = -setWidth;    // ortadaki setten başla
        apply(false);
    }
    window.addEventListener("load", measure);
    if (document.readyState === "complete") measure();

    // Oklar (yumuşak)
    if (next) next.addEventListener("click", () => { offset -= step; apply(true); });
    if (prev) prev.addEventListener("click", () => { offset += step; apply(true); });
    track.addEventListener("transitionend", normalize);

    // Fare tekerleği (anlık)
    track.addEventListener("wheel", (e) => {
        if (e.deltaY === 0) return;
        e.preventDefault();
        offset -= e.deltaY;
        apply(false);
        normalize();
    }, { passive: false });

    // Sürükleme (anlık)
    let isDown = false, startX, startOffset;
    track.addEventListener("pointerdown", (e) => {
        isDown = true;
        track.classList.add("dragging");
        startX = e.clientX;
        startOffset = offset;
        track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointermove", (e) => {
        if (!isDown) return;
        offset = startOffset + (e.clientX - startX);
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

    window.addEventListener("resize", measure);
})();