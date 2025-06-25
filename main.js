document.addEventListener("DOMContentLoaded", function () {

    // --- Time and Date ---
    function pad(n) { return n < 10 ? "0" + n : n; }
    function updateTimeAndDate() {
        const now = new Date();
        document.querySelector(".time").textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        document.querySelector(".date").textContent = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    }
    updateTimeAndDate();
    setInterval(updateTimeAndDate, 1000);

    // --- Responsive Container ---
    function updateContainerSize() {
        const vw = window.innerWidth, constant = 500;
        document.querySelector('.main-container').style.width = (constant / vw * 100) + 'vw';
    }
    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);

    // --- Wallpaper Parallax and Zoom ---
    const wallpaper = document.getElementById('wallpaper-bg');
    const parallaxStrength = 1;
    const zoomMargin = 2 * parallaxStrength;

    function updateWallpaperZoomAndPosition() {
        const imgW = wallpaper.naturalWidth, imgH = wallpaper.naturalHeight;
        const winW = window.innerWidth, winH = window.innerHeight;
        if (!imgW || !imgH) return;
        const P = zoomMargin / 100;
        const scale = Math.max(
            winW / (imgW * (1 - P)),
            winH / (imgH * (1 - P))
        );
        wallpaper.style.width = `${imgW * scale}px`;
        wallpaper.style.height = `${imgH * scale}px`;
        wallpaper.style.left = `calc(50vw - ${imgW * scale / 2}px)`;
        wallpaper.style.top = `calc(50vh - ${imgH * scale / 2}px)`;
    }
    function ensureWallpaperReady() {
        if (wallpaper.complete && wallpaper.naturalWidth) updateWallpaperZoomAndPosition();
        else wallpaper.onload = updateWallpaperZoomAndPosition;
    }
    ensureWallpaperReady();
    window.addEventListener('resize', updateWallpaperZoomAndPosition);

    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    document.addEventListener("mousemove", function (e) {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        const imgW = wallpaper.offsetWidth, imgH = wallpaper.offsetHeight;
        const maxShiftX = imgW * (parallaxStrength / 100);
        const maxShiftY = imgH * (parallaxStrength / 100);
        targetX = -x * maxShiftX;
        targetY = -y * maxShiftY;
    });
    document.addEventListener("mouseleave", function () {
        targetX = 0; targetY = 0;
    });
    (function animateParallax() {
        currentX += (targetX - currentX) * 0.05;
        currentY += (targetY - currentY) * 0.05;
        wallpaper.style.transform = `translate(${currentX}px, ${currentY}px)`;
        requestAnimationFrame(animateParallax);
    })();

    // --- Command Input: Bookmark Navigation & Search ---
    const commandInput = document.querySelector(".search-container input");
    const bookmarks = document.querySelectorAll(".bookmark-item a");
    const prefix = "/";

    // --- Bookmark Navigation Setup ---
    bookmarks.forEach(b => {
        if (!b.dataset.original) b.dataset.original = b.textContent.trim().replace(/^[\/\-\.\s]+/, "");
        if (!b.dataset.fullColor) b.dataset.fullColor = getComputedStyle(b).color;
        b.textContent = prefix + b.dataset.original;
    });

    function getDimColor(color, alpha) {
        let rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return rgb ? `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${alpha})` : color;
    }

    // --- Bookmark Navigation Logic ---
    function updateBookmarks() {
        const query = commandInput.value.trim();
        let exactMatchIndex = -1, matchIndexes = [];

        bookmarks.forEach((b, i) => {
            const displayText = prefix + b.dataset.original;
            if (query && query.startsWith(prefix) && displayText.toLowerCase() === query.toLowerCase()) {
                exactMatchIndex = i;
            }
        });

        bookmarks.forEach((b, i) => {
            const original = b.dataset.original, fullColor = b.dataset.fullColor, dimColor = getDimColor(fullColor, 0.5);
            const displayText = prefix + original;
            const parent = b.closest('.bookmark-item');
            parent.classList.remove('search-single-match');

            if (exactMatchIndex !== -1) {
                if (i === exactMatchIndex) {
                    b.innerHTML = displayText;
                    b.style.color = fullColor;
                    parent.classList.add('search-match', 'search-single-match');
                    b.style.pointerEvents = "auto";
                    b.removeAttribute("tabindex");
                } else {
                    b.innerHTML = displayText;
                    b.style.color = dimColor;
                    parent.classList.remove('search-match', 'search-single-match');
                    b.style.pointerEvents = "none";
                    b.setAttribute("tabindex", "-1");
                }
            } else if (!query || !query.startsWith(prefix)) {
                b.innerHTML = displayText;
                b.style.color = fullColor;
                parent.classList.add('search-match');
                b.style.pointerEvents = "auto";
                b.removeAttribute("tabindex");
            } else if (displayText.toLowerCase().includes(query.toLowerCase())) {
                matchIndexes.push(i);
                const regex = new RegExp(`(${query.replace(/([.*+?^${}()|[\]\\])/g, "\\$1")})`, "ig");
                b.innerHTML = `<span class="non-match" style="color: ${dimColor};">${displayText.replace(regex, `<span class="match" style="color: ${fullColor};">$1</span>`)}</span>`;
                parent.classList.add('search-match');
                b.style.pointerEvents = "auto";
                b.removeAttribute("tabindex");
            } else {
                b.innerHTML = displayText;
                b.style.color = dimColor;
                parent.classList.remove('search-match', 'search-single-match');
                b.style.pointerEvents = "none";
                b.setAttribute("tabindex", "-1");
            }
        });

        if (exactMatchIndex === -1 && matchIndexes.length === 1) {
            bookmarks[matchIndexes[0]].closest('.bookmark-item').classList.add('search-single-match');
        }
    }

    // --- Wiggle Effect ---
    function triggerWiggle(input) {
        input.classList.add("shake");
        input.addEventListener("animationend", function handler() {
            input.classList.remove("shake");
            input.removeEventListener("animationend", handler);
        });
    }

    // --- Input Events ---
    commandInput.addEventListener("input", updateBookmarks);

    commandInput.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        const query = commandInput.value.trim();

        if (query === "") {
            triggerWiggle(commandInput);
            return;
        }

        if (query.startsWith(prefix)) {
            updateBookmarks();
            const selected = document.querySelector('.bookmark-item.search-single-match a');
            if (selected && selected.style.pointerEvents !== "none") {
                window.open(selected.href, '_blank');
            } else {
                triggerWiggle(commandInput);
            }
        } else {
            const searchUrl = "https://www.google.com/search?q=" + encodeURIComponent(query);
            window.open(searchUrl, '_blank');
        }
    });

    // --- Initialize Bookmark Navigation UI ---
    updateBookmarks();
});