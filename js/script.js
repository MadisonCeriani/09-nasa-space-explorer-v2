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

	const caption = document.createElement('p');
	// show title and date
	caption.textContent = `${item.title || 'Untitled'} — ${item.date || ''}`;

	itemDiv.appendChild(img);
	itemDiv.appendChild(caption);
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