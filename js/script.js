// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// Grab UI elements
const getImageBtn = document.getElementById('getImageBtn');
const gallery = document.getElementById('gallery');

// --- Did You Know facts (stored here and chosen at random on page load) ---
const didYouKnowFacts = [
	"A day on Venus is longer than a year on Venus — it rotates very slowly compared to its orbit.",
	"Jupiter's Great Red Spot is a huge storm larger than Earth that has been raging for centuries.",
	"Neutron stars are so dense that a teaspoon of neutron-star material would weigh about a billion tons on Earth.",
	"There are more trees on Earth than stars in the Milky Way — estimates suggest ~3 trillion trees vs ~100-400 billion stars.",
	"The footprints left on the Moon will likely remain for millions of years because there's no wind to erase them.",
	"Saturn could float in water — it's the least dense planet in our solar system (less dense than water).",
	"Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.",
	"A spoonful of the Sun's core would be incredibly heavy — but the Sun's core is plasma, not solid material.",
	"The Milky Way and Andromeda galaxies are on a collision course and will merge in about 4 billion years.",
	"There are diamond rain storms on some planets like Neptune and Uranus under extreme pressure and temperature."
];

function createDidYouKnowElement(fact) {
	const box = document.createElement('div');
	box.className = 'did-you-know';
	box.innerHTML = `
		<h3>Did you know?</h3>
		<p>${fact}</p>
	`;
	return box;
}

function showRandomDidYouKnow() {
	if (!gallery) return;
	// pick a random fact
	const idx = Math.floor(Math.random() * didYouKnowFacts.length);
	const fact = didYouKnowFacts[idx];

	// remove existing if present
	const existing = document.querySelector('.did-you-know');
	if (existing) existing.remove();

	const el = createDidYouKnowElement(fact);
	// insert the fact box right above the gallery
	gallery.parentNode.insertBefore(el, gallery);
}

// ensure we run on load (works whether this script runs before or after DOMContentLoaded)
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', showRandomDidYouKnow);
} else {
	showRandomDidYouKnow();
}

// Helper: clear gallery
function clearGallery() {
	gallery.innerHTML = '';
}

// Helper: show a placeholder message in the gallery
function showPlaceholder(message) {
	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">🔭</div>
			<p>${message}</p>
		</div>
	`;
}

// Render a single gallery item (handles images and videos)
function renderItem(item) {
	const itemDiv = document.createElement('div');
	itemDiv.className = 'gallery-item';

	const caption = document.createElement('p');
	// show title and date
	caption.textContent = `${item.title || 'Untitled'} — ${item.date || ''}`;

	if (item.media_type === 'image') {
		const img = document.createElement('img');
		// prefer hdurl when available
		img.src = item.hdurl || item.url || '';
		img.alt = item.title || 'Space image';
		img.loading = 'lazy';
		itemDiv.appendChild(img);
	} else if (item.media_type === 'video') {
		// Try to show a thumbnail if available, otherwise show a play-card placeholder
		const thumbUrl = item.thumbnail_url || item.thumbnail || null;
		if (thumbUrl) {
			const img = document.createElement('img');
			img.src = thumbUrl;
			img.alt = item.title || 'Space video thumbnail';
			img.loading = 'lazy';
			itemDiv.appendChild(img);
		} else {
			// create a simple play placeholder
			const placeholder = document.createElement('div');
			placeholder.className = 'video-placeholder';
			placeholder.innerHTML = '<div class="play-icon">▶</div><div class="video-text">Watch video</div>';
			itemDiv.appendChild(placeholder);
		}

		// optionally, make the whole item a link that opens the video in a new tab if clicked with modifier
	} else {
		// unsupported media type - show a simple message
		const note = document.createElement('div');
		note.textContent = 'Unsupported media type';
		itemDiv.appendChild(note);
	}

	itemDiv.appendChild(caption);

	// clicking opens modal for both images and videos; if video can't embed, modal will include a link
	itemDiv.addEventListener('click', () => openModal(item));

	gallery.appendChild(itemDiv);
}

// Fetch data and render gallery
async function fetchAndRender() {
	try {
		getImageBtn.disabled = true;
		const prevText = getImageBtn.textContent;
		getImageBtn.textContent = 'Loading...';

		// show a friendly gallery-level loading message while we fetch
		showPlaceholder('loading space images 🚀');

		const res = await fetch(apodData);
		if (!res.ok) throw new Error(`Network response was not ok (${res.status})`);

		const data = await res.json();

		clearGallery();

		// Data is expected to be an array of APOD items
		if (!Array.isArray(data) || data.length === 0) {
			showPlaceholder('No images found in the dataset.');
			return;
		}

		// Render supported media types (images and videos)
		const items = data.filter(i => i.media_type === 'image' || i.media_type === 'video');
		if (items.length === 0) {
			showPlaceholder('No image or video items found in the dataset.');
			return;
		}

		items.forEach(renderItem);

	} catch (err) {
		clearGallery();
		showPlaceholder(`Error loading images: ${err.message}`);
		console.error(err);
	} finally {
		getImageBtn.disabled = false;
		getImageBtn.textContent = 'Fetch Space Images';
	}
}

// Wire the button click
if (getImageBtn) {
	getImageBtn.addEventListener('click', fetchAndRender);
} else {
	// If button is missing, log a warning so developer can fix HTML
	console.warn('Fetch Space Images button (#getImageBtn) not found in the DOM.');
}

/* ---------------------- Modal implementation ---------------------- */

// Modal elements will be created once and reused
let modalOverlay = null;
let modalImage = null;
let modalTitle = null;
let modalDate = null;
let modalExplanation = null;
let modalMediaContainer = null;

function ensureModal() {
	if (modalOverlay) return;

	// overlay
	modalOverlay = document.createElement('div');
	modalOverlay.className = 'modal-overlay';
	modalOverlay.setAttribute('role', 'dialog');
	modalOverlay.setAttribute('aria-hidden', 'true');
	modalOverlay.innerHTML = `
		<div class="modal" role="document">
			<button class="modal-close" aria-label="Close">×</button>
			<div class="modal-body">
				<div class="modal-media">
					<img class="modal-image" src="" alt="" />
				</div>
				<div class="modal-info">
					<h2 class="modal-title"></h2>
					<div class="modal-date"></div>
					<p class="modal-explanation"></p>
				</div>
			</div>
		</div>
	`;

	document.body.appendChild(modalOverlay);

	// references
	modalMediaContainer = modalOverlay.querySelector('.modal-media');
	modalImage = modalOverlay.querySelector('.modal-image');
	modalTitle = modalOverlay.querySelector('.modal-title');
	modalDate = modalOverlay.querySelector('.modal-date');
	modalExplanation = modalOverlay.querySelector('.modal-explanation');

	// close handlers
	modalOverlay.addEventListener('click', (e) => {
		if (e.target === modalOverlay) closeModal();
	});
	modalOverlay.querySelector('.modal-close').addEventListener('click', closeModal);

	// close on ESC
	document.addEventListener('keydown', (e) => {
		if ((e.key === 'Escape' || e.key === 'Esc') && modalOverlay.classList.contains('open')) {
			closeModal();
		}
	});
}

function openModal(item) {
	ensureModal();
	// set content
	modalTitle.textContent = item.title || 'Untitled';
	modalDate.textContent = item.date || '';
	modalExplanation.textContent = item.explanation || '';

	// fill media area depending on type
	if (item.media_type === 'video') {
		// try to embed the provided url; many APOD video urls are embed-friendly
		const videoUrl = item.url || item.embed_url || '';
		// simple heuristic: if it's a YouTube watch link, convert to embed
		let iframeSrc = videoUrl;
		try {
			const u = new URL(videoUrl);
			if ((u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be'))) {
				// convert watch?v= to embed if needed
				if (u.hostname.includes('youtu.be')) {
					// short url format: https://youtu.be/ID
					const id = u.pathname.slice(1);
					iframeSrc = `https://www.youtube.com/embed/${id}`;
				} else if (u.searchParams.has('v')) {
					iframeSrc = `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
				}
			}
		} catch (e) {
			// ignore URL parsing errors and use raw url
		}

		// replace media container with an iframe (include helpful allow attributes)
		modalMediaContainer.innerHTML = `<iframe class="modal-iframe" src="${iframeSrc}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${(item.title||'Video')}"></iframe>`;

		// add a clear fallback link so users can open the video in a new tab if embedding fails
		const infoDiv = modalOverlay.querySelector('.modal-info');
		if (infoDiv) {
			// remove any previous link
			const prev = infoDiv.querySelector('.modal-video-link');
			if (prev) prev.remove();
			const fallbackLink = document.createElement('a');
			fallbackLink.className = 'modal-video-link';
			fallbackLink.href = item.url || videoUrl || '#';
			fallbackLink.target = '_blank';
			fallbackLink.rel = 'noopener noreferrer';
			fallbackLink.textContent = 'Open video in a new tab';
			infoDiv.appendChild(fallbackLink);
		}
	} else {
		const src = item.hdurl || item.url || '';
		modalMediaContainer.innerHTML = `<img class="modal-image" src="${src}" alt="${(item.title||'Space image')}" />`;
		modalImage = modalMediaContainer.querySelector('.modal-image');
	}

	// show
	modalOverlay.setAttribute('aria-hidden', 'false');
	modalOverlay.classList.add('open');

	// trap focus minimally: move focus to close button
	const closeBtn = modalOverlay.querySelector('.modal-close');
	if (closeBtn) closeBtn.focus();
}

function closeModal() {
	if (!modalOverlay) return;
	modalOverlay.classList.remove('open');
	modalOverlay.setAttribute('aria-hidden', 'true');
	// remove image src to stop downloads when closed
	if (modalImage) modalImage.src = '';
}