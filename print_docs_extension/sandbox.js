// Create the previewer
let container = document.getElementById('preview-container');
const viewer = new VivlioStyle.Viewer({
	renderMode: 'spread',
	bindWindowKeys: true
});
viewer.init(container);

// Signal readiness
window.addEventListener('DOMContentLoaded', () => {
	window.parent.postMessage({ action: 'SANDBOX_READY' }, '*');
});

// Wait for HTML code
window.addEventListener('message', (event) => {
	if (event.data && event.data.action === 'RENDER_HTML') {
		const htmlBrut = event.data.html;

		// Création du Blob sécurisé local à la sandbox
		const blob = new Blob([htmlBrut], { type: 'text/html' });
		const blobUrl = URL.createObjectURL(blob);

		// Lancement du rendu Vivliostyle
		viewer.loadDocument(blobUrl)
			.catch(err => console.error("Erreur de rendu Vivliostyle :", err));
	}
});
