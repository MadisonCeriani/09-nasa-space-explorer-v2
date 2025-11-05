// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// Grab UI elements
const getImageBtn = document.getElementById('getImageBtn');
const gallery = document.getElementById('gallery');

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

// Render a single gallery item (image, title, date)
function renderItem(item) {
	const itemDiv = document.createElement('div');
	itemDiv.className = 'gallery-item';

	const img = document.createElement('img');
	// prefer hdurl when available
	img.src = item.hdurl || item.url || '';
	img.alt = item.title || 'Space image';
	img.loading = 'lazy';

	const caption = document.createElement('p');
	// show title and date
	caption.textContent = `${item.title || 'Untitled'} — ${item.date || ''}`;

	itemDiv.appendChild(img);
	itemDiv.appendChild(caption);
	// open modal on click and pass full item data
	itemDiv.addEventListener('click', () => openModal(item));

	gallery.appendChild(itemDiv);
}

// Fetch data and render gallery
async function fetchAndRender() {
	try {
		getImageBtn.disabled = true;
		const prevText = getImageBtn.textContent;
		getImageBtn.textContent = 'Loading...';

		const res = await fetch(apodData);
		if (!res.ok) throw new Error(`Network response was not ok (${res.status})`);

		const data = await res.json();

		clearGallery();

		// Data is expected to be an array of APOD items
		if (!Array.isArray(data) || data.length === 0) {
			showPlaceholder('No images found in the dataset.');
			return;
		}

		// Only render items that are images (skip videos)
		const images = data.filter(i => i.media_type === 'image');
		if (images.length === 0) {
			showPlaceholder('No image items found (dataset contains only videos).');
			return;
		}

		images.forEach(renderItem);

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
	const src = item.hdurl || item.url || '';
	modalImage.src = src;
	modalImage.alt = item.title || 'Space image';
	modalTitle.textContent = item.title || 'Untitled';
	modalDate.textContent = item.date || '';
	modalExplanation.textContent = item.explanation || '';

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