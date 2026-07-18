document.addEventListener('DOMContentLoaded', (_event) => {
	// Create an inner iframe
	const iframe = document.createElement('iframe');
	iframe.src = "sandbox.html";
	iframe.style.cssText = "width: 100%; height: 100vh; border: none";
	document.body.appendChild(iframe);

	// Wait for the sandbox in the iframe to be ready
	window.addEventListener('message', (event) => {
		if (event.data && event.data.action === 'SANDBOX_READY') {
			// Load the document
			chrome.storage.local.get(['html'], (result) => {
				if (!result || !result.html) return;
				event.source.postMessage({
					action: 'RENDER_HTML',
					html: result.html
				}, '*');
			});
		}
	});	

});
