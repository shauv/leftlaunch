document.addEventListener("DOMContentLoaded", function () {
    function pad(n) { return n < 10 ? "0" + n : n; }
    function updateTimeAndDate() {
        const now = new Date();
        document.querySelector(".time").textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        document.querySelector(".date").textContent = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    }
    updateTimeAndDate();
    setInterval(updateTimeAndDate, 1000);

    const searchInput = document.querySelector(".search-container input");
    const bookmarks = document.querySelectorAll(".bookmark-item a");

    bookmarks.forEach(b => {
        if (!b.dataset.original) b.dataset.original = b.textContent.trim();
        if (!b.dataset.fullColor) b.dataset.fullColor = getComputedStyle(b).color;
        if (!b.textContent.trim().startsWith("/")) {
            b.textContent = "/" + b.dataset.original;
        }
    });

    function getDimColor(color, alpha) {
        let rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return rgb ? `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${alpha})` : color;
    }

    let matchCount = 0, singleMatchBookmark = null, exactMatchBookmark = null;
    function updateBookmarks() {
        const query = searchInput.value.trim();
        matchCount = 0; singleMatchBookmark = null; exactMatchBookmark = null;
        bookmarks.forEach(b => {
            const original = b.dataset.original, fullColor = b.dataset.fullColor, dimColor = getDimColor(fullColor, 0.5);
            const displayText = "/" + original;
            if (!query || !query.startsWith("/")) {
                b.innerHTML = displayText; b.style.color = fullColor;
            } else if (displayText.toLowerCase().includes(query.toLowerCase())) {
                matchCount++; singleMatchBookmark = b;
                if(displayText.toLowerCase() === query.toLowerCase()) exactMatchBookmark = b;
                const regex = new RegExp(`(${query.replace(/([.*+?^${}()|[\]\\])/g, "\\$1")})`, "ig");
                b.innerHTML = `<span class="non-match" style="color: ${dimColor};">${displayText.replace(regex, `<span class="match" style="color: ${fullColor};">$1</span>`)}</span>`;
            } else {
                b.innerHTML = displayText; b.style.color = dimColor;
            }
        });
    }

    searchInput.addEventListener("input", updateBookmarks);
    searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            updateBookmarks();
            if (exactMatchBookmark) window.open(exactMatchBookmark.href, '_blank');
            else if (matchCount === 1 && singleMatchBookmark) window.open(singleMatchBookmark.href, '_blank');
            else {
                searchInput.classList.add("shake");
                searchInput.addEventListener("animationend", function handler() {
                    searchInput.classList.remove("shake");
                    searchInput.removeEventListener("animationend", handler);
                });
            }
        }
    });

    function updateContainerSize() {
        const vw = window.innerWidth, constant = 500;
        document.querySelector('.main-container').style.width = (constant / vw * 100) + 'vw';
    }
    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);

    const wallpaper = document.getElementById('wallpaper-bg');
    const strength = 1;
    const zoomMargin = 2 * strength;

    function updateWallpaperZoomAndPosition() {
        const imgW = wallpaper.naturalWidth;
        const imgH = wallpaper.naturalHeight;
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        const P = zoomMargin / 100;
        const scaleX = winW / (imgW * (1 - P));
        const scaleY = winH / (imgH * (1 - P));
        const scale = Math.max(scaleX, scaleY);

        wallpaper.style.width = `${imgW * scale}px`;
        wallpaper.style.height = `${imgH * scale}px`;
        wallpaper.style.left = `calc(50vw - ${imgW * scale / 2}px)`;
        wallpaper.style.top = `calc(50vh - ${imgH * scale / 2}px)`;
    }

    if (wallpaper.complete && wallpaper.naturalWidth) {
        updateWallpaperZoomAndPosition();
    } else {
        wallpaper.onload = updateWallpaperZoomAndPosition;
    }
    window.addEventListener('resize', updateWallpaperZoomAndPosition);

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    document.addEventListener("mousemove", function (e) {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        const imgW = wallpaper.offsetWidth;
        const imgH = wallpaper.offsetHeight;
        const maxShiftX = imgW * (strength / 100);
        const maxShiftY = imgH * (strength / 100);

        targetX = -x * maxShiftX;
        targetY = -y * maxShiftY;
    });
    document.addEventListener("mouseleave", function () {
        targetX = 0;
        targetY = 0;
    });
    function animateParallax() {
        currentX += (targetX - currentX) * 0.05;
        currentY += (targetY - currentY) * 0.05;
        wallpaper.style.transform = `translate(${currentX}px, ${currentY}px)`;
        requestAnimationFrame(animateParallax);
    }
    animateParallax();
});