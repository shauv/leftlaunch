document.addEventListener("DOMContentLoaded", function () {
	// Wallpaper
	function setWallpaper() {
		const wallpaperImg = document.getElementById('wallpaper-bg');
		const configWallpaper = window.STARTPAGE_CONFIG?.wallpaper;
		wallpaperImg.src = configWallpaper && configWallpaper.trim() ? configWallpaper : "assets/wallpaper.png";
	}

	// Apply font family and color from window.STARTPAGE_CONFIG.text
	if (window.STARTPAGE_CONFIG && window.STARTPAGE_CONFIG.text) {
		document.documentElement.style.setProperty('--font-family', window.STARTPAGE_CONFIG.text.fontFamily);
		document.documentElement.style.setProperty('--secondary-color', window.STARTPAGE_CONFIG.text.color);
		// Apply text size from window.STARTPAGE_CONFIG.text
		document.documentElement.style.setProperty('--text-size', window.STARTPAGE_CONFIG.text.size);
	}

	// Apply container color, border radius, and outline color from window.STARTPAGE_CONFIG.containers
	if (window.STARTPAGE_CONFIG && window.STARTPAGE_CONFIG.containers) {
		document.documentElement.style.setProperty('--primary-color', window.STARTPAGE_CONFIG.containers.color);
		document.documentElement.style.setProperty('--container-radius', window.STARTPAGE_CONFIG.containers.borderRadius);
		if (window.STARTPAGE_CONFIG.containers.outlineColor) {
			document.documentElement.style.setProperty('--outline-color', window.STARTPAGE_CONFIG.containers.outlineColor);
		}
	}

	// Wallpaper Parallax
	function setupWallpaperParallax() {
		const wallpaper = document.getElementById('wallpaper-bg');
		const navbar = document.querySelector('.navbar-outer');
		const bookmarksOuter = document.querySelector('.bookmarks-outer');
		const parallaxStrength = 1;
		const zoomMargin = 2 * parallaxStrength;
		function updateWallpaperZoomAndPosition() {
			const imgW = wallpaper.naturalWidth, imgH = wallpaper.naturalHeight;
			const winW = window.innerWidth, winH = window.innerHeight;
			if (!imgW || !imgH) return;
			const P = zoomMargin / 100;
			const scale = Math.max(winW / (imgW * (1 - P)), winH / (imgH * (1 - P)));
			wallpaper.style.width = `${imgW * scale}px`;
			wallpaper.style.height = `${imgH * scale}px`;
			wallpaper.style.left = `calc(50dvw - ${imgW * scale / 2}px)`;
			wallpaper.style.top = `calc(50dvh - ${imgH * scale / 2}px)`;
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
		function getScaleFromCenter(elem) {
			const rect = elem.getBoundingClientRect();
			const elemX = rect.left + rect.width / 2;
			const elemY = rect.top + rect.height / 2;
			const centerX = window.innerWidth / 2;
			const centerY = window.innerHeight / 2;
			const dx = (elemX - centerX) / centerX;
			const dy = (elemY - centerY) / centerY;
			return Math.sqrt(dx * dx + dy * dy);
		}
		(function animateParallax() {
			currentX += (targetX - currentX) * 0.05;
			currentY += (targetY - currentY) * 0.05;
			wallpaper.style.transform = `translate(${currentX}px, ${currentY}px)`;
			// Navbar parallax
			if (navbar) {
				const scale = getScaleFromCenter(navbar) * 0.2;
				navbar.style.transform = `translate(${-currentX * scale}px, ${-currentY * scale}px)`;
			}
			// Bookmarks parallax
			if (bookmarksOuter) {
				const buttons = bookmarksOuter.querySelectorAll('.bookmark-square-btn');
				buttons.forEach(btn => {
					const scale = getScaleFromCenter(btn) * 0.8;
					btn.style.transform = `translate(${-currentX * scale}px, ${-currentY * scale}px)`;
				});
			}
			requestAnimationFrame(animateParallax);
		})();
	}

	// Navbar
	function setupNavbarInput(navbarInput, updateBookmarkHighlights) {
		const placeholderText = window.STARTPAGE_CONFIG?.text?.placeholder || "type to filter bookmarks...";
		navbarInput.addEventListener('input', updateBookmarkHighlights);
		navbarInput.addEventListener('focus', function() {
			navbarInput.setAttribute('data-has-focus', 'true');
			navbarInput.setAttribute('placeholder', '');
		});
		navbarInput.addEventListener('blur', function() {
			navbarInput.setAttribute('data-has-focus', 'false');
			navbarInput.setAttribute('placeholder', placeholderText);
		});
		navbarInput.setAttribute('placeholder', placeholderText);
	}
	function setupNavbarShortcuts(navbarInput) {
		document.addEventListener('keydown', function(e) {
			if (e.key === 'Tab') {
				e.preventDefault();
				const input = document.querySelector('.navbar-container input');
				if (document.activeElement === input) {
					input.blur();
				} else {
					input.focus();
				}
			}
		});
	}
	function setupBookmarkKeyShortcuts(bookmarkElements, navbarInput) {
		document.addEventListener('keydown', function(e) {
			if (document.activeElement === navbarInput) return;
			if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
			const key = e.key.toLowerCase();
			bookmarkElements.forEach(({btn}) => {
				if (btn.textContent.toLowerCase() === key) {
					btn.click();
				}
			});
		});
	}

	// Keymap presets
	const KEYMAP_PRESETS = {
		QWERTY: ["Q", "W", "E", "R", "T", "A", "S", "D", "F", "G", "Z", "X", "C", "V", "B"],
		QWERTZ: ["Q", "W", "E", "R", "T", "A", "S", "D", "F", "G", "Y", "X", "C", "V", "B"],
		AZERTY: ["A", "Z", "E", "R", "T", "Q", "S", "D", "F", "G", "W", "X", "C", "Y", "V"],
		Colemak: ["Q", "W", "F", "P", "G", "A", "R", "S", "T", "D", "Z", "X", "C", "V", "B"],
		Dvorak: ["'", ",", ".", "P", "Y", "A", "O", "E", "U", "I", ";", "Q", "J", "K", "X"],
	};
	function getActiveKeymap() {
		const cfg = window.STARTPAGE_CONFIG.keymap;
		if (!cfg) return KEYMAP_PRESETS.QWERTY;
		if (cfg.preset === "Custom" && Array.isArray(cfg.customKeys)) {
			return cfg.customKeys;
		}
		return KEYMAP_PRESETS[cfg.preset] || KEYMAP_PRESETS.QWERTY;
	}
	function getKeyDisplay(key) {
		const cfg = window.STARTPAGE_CONFIG.keymap;
		if (cfg && cfg.case === "lowercase") return key.toLowerCase();
		return key.toUpperCase();
	}

	// Bookmarks
	function renderBookmarks(bookmarksConfig, bookmarksContainer, keyRows, gridPositions) {
		bookmarksContainer.innerHTML = "";
		const allBookmarks = bookmarksConfig.flatMap(row => row.items);
		let bookmarkIdx = 0;
		const bookmarkElements = [];
		for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
			for (let colIdx = 0; colIdx < 5; colIdx++) {
				const item = allBookmarks[bookmarkIdx];
				const div = document.createElement("div");
				div.className = `bookmark-square-item row-${rowIdx+1} col-${colIdx+1}`;
				div.style.gridRow = rowIdx + 1;
				div.style.gridColumn = `${gridPositions[rowIdx][colIdx]} / span 2`;
				const btn = document.createElement("button");
				btn.className = `bookmark-square-btn bookmark-${item.name.toLowerCase()}`;
				const activeKeymap = getActiveKeymap();
				btn.textContent = getKeyDisplay(activeKeymap[bookmarkIdx]);
				btn.onclick = () => window.open(item.url, '_blank');
				btn.setAttribute('aria-label', item.name);
				const label = document.createElement("div");
				label.className = "bookmark-square-label";
				label.textContent = item.name;
				div.appendChild(btn);
				div.appendChild(label);
				bookmarksContainer.appendChild(div);
				bookmarkElements.push({div, btn, label, name: item.name});
				bookmarkIdx++;
			}
		}
		return bookmarkElements;
	}
	function updateBookmarkHighlights(navbarInput, bookmarkElements) {
		const query = navbarInput.value.trim().toLowerCase();
		// Find best match only if query is non-empty
		let bestIdx = -1;
		let bestPriority = 0;
		if (query) {
			bookmarkElements.forEach(({name}, idx) => {
				const priority = getBookmarkMatchPriority(query, {name});
				if (priority > bestPriority) {
					bestPriority = priority;
					bestIdx = idx;
				}
			});
		}
		bookmarkElements.forEach(({btn, label, name}, idx) => {
			const nameLower = name.toLowerCase();
			btn.classList.remove('priority-match');
			if (!query) {
				label.innerHTML = name;
				label.style.color = '';
				btn.style.filter = '';
				btn.style.opacity = '';
			} else if (nameLower.includes(query)) {
				const startIdx = nameLower.indexOf(query);
				const endIdx = startIdx + query.length;
				const before = name.slice(0, startIdx);
				const match = name.slice(startIdx, endIdx);
				const after = name.slice(endIdx);
				label.innerHTML = `<span style='opacity:0.4;'>${before}</span><span style='opacity:1;'>${match}</span><span style='opacity:0.4;'>${after}</span>`;
				label.style.color = '';
				btn.style.filter = '';
				btn.style.opacity = '';
			} else {
				label.innerHTML = `<span style='opacity:0.4;'>${name}</span>`;
				label.style.color = '';
				btn.style.filter = '';
				btn.style.opacity = '0.4';
			}
			// Add priority-match class to best match only if query is non-empty and there is a match
			if (query && idx === bestIdx && bestPriority > 0) {
				btn.classList.add('priority-match');
			}
		});
	}
	function setupNavbarEnter(navbarInput, bookmarkElements) {
		navbarInput.addEventListener("keydown", function (e) {
			if (e.key === "Escape") {
				navbarInput.blur();
				return;
			}
			if (e.key !== "Enter") return;
			const query = navbarInput.value.trim().toLowerCase();
			if (!query) {
				shakeInput(navbarInput);
				return;
			}
			const allBookmarks = bookmarkElements.map(({name, btn}) => ({name, btn}));
			const bestMatch = getBestBookmarkMatch(query, allBookmarks);
			if (bestMatch) {
				bestMatch.btn.click();
			} else {
				shakeInput(navbarInput);
			}
		});
	}

	function getBookmarkMatchPriority(input, bookmark) {
		const name = bookmark.name.toLowerCase();
		const query = input.toLowerCase();
		if (name === query) return 3; // exact match
		if (name.startsWith(query)) return 2; // prefix match
		if (name.includes(query)) return 1; // substring match
		return 0; // no match
	}
	function getBestBookmarkMatch(input, bookmarks) {
		let best = null;
		let bestPriority = 0;
		for (const bm of bookmarks) {
			const priority = getBookmarkMatchPriority(input, bm);
			if (priority > bestPriority) {
				best = bm;
				bestPriority = priority;
			}
			// If priorities are equal, keep the first (bookmark order)
		}
		return best;
	}

	// Minimal shake logic for input feedback
	function shakeInput(input) {
		input.classList.add("shake");
		setTimeout(() => input.classList.remove("shake"), 300);
	}

	// Initialization
	setWallpaper();
	setupWallpaperParallax();
	const bookmarksConfig = window.STARTPAGE_CONFIG?.bookmarks || [];
	const bookmarksContainer = document.getElementById("bookmarks-container");
	const keyRows = [
		['q', 'w', 'e', 'r', 't'],
		['a', 's', 'd', 'f', 'g'],
		['z', 'x', 'c', 'v', 'b']
	];
	const gridPositions = [
		[1, 3, 5, 7, 9],
		[2, 4, 6, 8, 10],
		[3, 5, 7, 9, 11]
	];
	const bookmarkElements = renderBookmarks(bookmarksConfig, bookmarksContainer, keyRows, gridPositions);
	const navbarInput = document.getElementById('navbar');
	setupNavbarInput(navbarInput, () => updateBookmarkHighlights(navbarInput, bookmarkElements));
	setupNavbarShortcuts(navbarInput);
	setupBookmarkKeyShortcuts(bookmarkElements, navbarInput);
	setupNavbarEnter(navbarInput, bookmarkElements);
	updateBookmarkHighlights(navbarInput, bookmarkElements);
	document.body.classList.remove("preload");
});