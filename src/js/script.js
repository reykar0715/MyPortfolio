/* ===========================
   TİLKİ SCROLL ANİMASYONU
=========================== */

(function () {
    const fox = document.getElementById("fox");
    const foxImg = document.getElementById("fox-img");
    const blocks = document.querySelectorAll(".about-block");
    if (!fox || !foxImg || !blocks.length) return;

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

    // Yatay konum (bloğun karşı tarafı)
    function placeX(side) {
        return side === "left" ? "3%" : "calc(97% - " + fox.offsetWidth + "px)";
    }

    // Dikey konum (o bloğun tam hizası)
    function placeY(i) {
        const b = blocks[i];
        return (b.offsetTop + b.offsetHeight / 2 - FOX_H / 2) + "px";
    }

    function setRest(st) {
        foxImg.classList.toggle("flip", st.facing === "right");
        foxImg.src = (st.rest === "lie") ? F.lieLeft : F.sitLeft;
    }

    let current = -1;

    function goTo(i) {
        const st = stateFor(i);

        // Hedef konumu ayarla -> CSS top/left kavisin taban hareketini yapar
        fox.style.left = placeX(st.foxSide);
        fox.style.top = placeY(i);

        if (reduce) { setRest(st); return; }

        // Gittiği tarafa göre zıplama karesi
        const frames = (st.foxSide === "right") ? F.jumpRight : F.jumpLeft;
        foxImg.classList.remove("flip");
        foxImg.src = frames[0];

        // Hop animasyonunu sıfırdan başlat (yukarı sıçrama kavisi)
        fox.classList.remove("hop");
        void fox.offsetWidth;   // reflow: animasyon yeniden tetiklensin
        fox.classList.add("hop");

        let k = 0;
        const iv = setInterval(() => {
            k++;
            if (k < frames.length) {
                foxImg.src = frames[k];
            } else {
                clearInterval(iv);
                fox.classList.remove("hop");
                setRest(st);
            }
        }, 200);
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            const i = [...blocks].indexOf(e.target);
            if (i === current) return;

            fox.classList.add("visible");

            if (current === -1) {
                const st = stateFor(i);
                fox.style.left = placeX(st.foxSide);
                fox.style.top = placeY(i);
                setRest(st);
            } else {
                goTo(i);
            }
            current = i;
        });
    }, { threshold: 0.5, rootMargin: "-25% 0px -25% 0px" });

    blocks.forEach(b => io.observe(b));

    // Pencere boyutu değişince konumu güncelle
    window.addEventListener("resize", () => {
        if (current < 0) return;
        const st = stateFor(current);
        fox.style.left = placeX(st.foxSide);
        fox.style.top = placeY(current);
    });
})();