const docs_url = "docs.numerique.gouv.fr/docs";

async function clicked(event) {
	const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
	if (!tab) return;
	let pdid = null;
	// Check if we are on a Docs URL, or a paged document created by the extension
	if (!tab.url || !tab.url.includes(docs_url)) {
		// Otherwise, check if the HTML tag has a "data-printdocs" attribute. In this case, retrieves it because it points to the source tab holding the document
		const resp = await chrome.scripting.executeScript({
			target: {tabId: tab.id },
			func: () => { return document.documentElement.dataset["printdocs"]; }
		});
		pdid = resp?.[0]?.result;
		if (!pdid) {
			console.log("L'extension ne fonctionne que sur l'outil Docs de la Suite numérique.");
			return;
		}
	}
	const tname = event.target.innerHTML;
	// On the source document, inject the content script and run the function apply_template to generate an HTML
	if (!pdid) { // If we were on the original source document, we create a new window with the paged document
		await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			files: ["content.js"]
		});
		chrome.tabs.sendMessage(tab.id, {
			action: "apply_template",
			template: tname,
			tabid: tab.id,
			create: true
		});
	} else { // Otherwise we replace the content of the current tab with the paged document
		chrome.tabs.sendMessage(parseInt(pdid), {
			action: "apply_template",
			template: tname,
			tabid: pdid,
			create: true
		});
		await chrome.tabs.remove(tab.id);
	}
	// Close the popup
	window.close();
}

document.addEventListener('DOMContentLoaded', function(_event) {
	let ul = document.getElementsByTagName('ul')[0];
	chrome.storage.local.get(['custom_css'], (result) => {
		const templates = result['custom_css'] || {};
		for (const tname in templates) {
			let li = document.createElement('li');
			let a = document.createElement('a');
			a.innerHTML = tname;
			a.setAttribute("href", "#");
			a.addEventListener('click', clicked);
			li.appendChild(a);
			ul.appendChild(li);
		}
	});
});
