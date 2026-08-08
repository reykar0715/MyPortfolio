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