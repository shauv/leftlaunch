document.addEventListener("DOMContentLoaded", function () {
    // Set container color CSS variable from config
    const containerColor = (window.STARTPAGE_CONFIG && window.STARTPAGE_CONFIG.containerColor) || "rgba(0, 0, 0, 0.4)";
    document.documentElement.style.setProperty('--container-bg', containerColor);

    // --- Fun feature toggles from config ---
    const config = window.STARTPAGE_CONFIG && window.STARTPAGE_CONFIG.fun
        ? window.STARTPAGE_CONFIG.fun
        : { tetris: true, null: true };

    // Hide Tetris if disabled
    if (!config.tetris) {
        const tetrisEl = document.getElementById("tetris-container") || document.querySelector(".tetris-container");
        if (tetrisEl) tetrisEl.style.display = "none";
    }

    // Hide Null if disabled
    if (!config.null) {
        const nullEl = document.getElementById("nullWindow");
        if (nullEl) nullEl.style.display = "none";
    }

    // --- Dynamic Bookmarks Rendering ---
    const bookmarksConfig = (window.STARTPAGE_CONFIG && window.STARTPAGE_CONFIG.bookmarks) || [];
    const bookmarksContainer = document.getElementById("bookmarks-container");
    bookmarksContainer.innerHTML = ""; // Clear any static content

    const MAX_BOOKMARKS_PER_COLUMN = 5;

    // Render columns and bookmarks (no column labels)
    bookmarksConfig
        .slice()
        .sort((a, b) => Number(a.column) - Number(b.column))
        .forEach(column => {
            const section = document.createElement("section");
            section.className = "category";
            section.id = `column-${column.column}`;

            const ul = document.createElement("ul");
            // Render actual bookmarks
            column.items.forEach(item => {
                const li = document.createElement("li");
                const div = document.createElement("div");
                div.className = `bookmark-item bookmark-${item.name.toLowerCase()}`;
                const a = document.createElement("a");
                a.href = item.url;
                a.target = "_blank";
                a.draggable = "false";
                a.textContent = "/" + item.name;
                a.style.color = item.color;
                a.dataset.original = item.name;
                a.dataset.fullColor = item.color;
                div.appendChild(a);
                li.appendChild(div);
                ul.appendChild(li);
            });
            section.appendChild(ul);
            bookmarksContainer.appendChild(section);
        });

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

    function getDimColor(color, alpha) {
        // If color is already rgba
        let rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgb) {
            return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${alpha})`;
        }
        // If color is hex, convert to rgba
        if (color[0] === "#") {
            let hex = color.replace("#", "");
            if (hex.length === 3) {
                hex = hex.split("").map(x => x + x).join("");
            }
            if (hex.length === 6) {
                const r = parseInt(hex.substring(0,2), 16);
                const g = parseInt(hex.substring(2,4), 16);
                const b = parseInt(hex.substring(4,6), 16);
                return `rgba(${r},${g},${b},${alpha})`;
            }
        }
        // fallback: just return the original color
        return color;
    }

    // --- Bookmark Navigation Logic ---
    function updateBookmarks() {
        const query = commandInput.value.trim();
        let exactMatchIndex = -1, matchIndexes = [];
        const bookmarks = document.querySelectorAll(".bookmark-item a");

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
            const bookmarks = document.querySelectorAll(".bookmark-item a");
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
        const bookmarks = document.querySelectorAll(".bookmark-item a");

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

    // At the very end:
    document.body.classList.remove("preload");

    // Ensure search bar is focused after showing content
    const searchInput = document.getElementById("search");
    if (searchInput) searchInput.focus();
});