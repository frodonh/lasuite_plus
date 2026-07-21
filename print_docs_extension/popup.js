const docs_url = "docs.numerique.gouv.fr/docs";
let tab = null;
let pdid = null;

function get_sources() {
	return chrome.tabs.query({active: true, currentWindow: true})
	.then((tabs) => {
		const tab = tabs[0];
		if (!tab) return {tab: null, parent: null};
		if (!tab.url || !tab.url.includes(docs_url)) {
			return chrome.scripting.executeScript({
				target: {tabId: tab.id },
				func: () => document.documentElement.dataset["printdocs"] 
			}).then((resp) => {
				const pdid = resp[0]?.result;
				return({tab: tab, parent: pdid});
			});
		} else return({tab: tab, parent: null});
	})
	.catch(() => {
		console.log("L'extension ne fonctionne que sur l'outil Docs de la Suite numérique.");
		return {tab: null, parent: null};
	})
}

async function clicked(event) {
	const tname = event.target.innerHTML;
	// On the source document, inject the content script and run the function apply_template to generate an HTML
	if (!pdid) { // If we were on the original source document, we create a new window with the paged document
		chrome.tabs.sendMessage(tab.id, {
			action: "apply_template",
			template: tname,
			tabid: tab.id,
			create: true
		});
	} else { // Otherwise we replace the content of the current tab with the paged document
		chrome.tabs.sendMessage(pdid, {
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

function export_pdf() {
	if (!pdid) return;
	chrome.scripting.executeScript({
		target: {tabId: pdid},
		files: ["content-paged.js"]
	}).then(() => {
		chrome.tabs.sendMessage(pdid, {
			action: "generate_pdf_bookmarks"
		});
	});
}

document.addEventListener('DOMContentLoaded', function(_event) {
	get_sources().then((res) => {
		tab = res.tab;
		pdid = res.parent;
		if (!pdid) {
			document.getElementById("section-actions").display = 'none';
			document.getElementsByClassName('section-divider')[0].display = 'none';
		} else pdid = parseInt(pdid);
		let ul = document.getElementById('templates-list');
		chrome.storage.local.get(['custom_css'], (result) => {
			const templates = result['custom_css'] || {};
			for (const tname in templates) {
				let li = document.createElement('li');
				let a = document.createElement('a');
				let span = document.createElement('span');
				span.textContent = tname;
				a.appendChild(span);
				a.setAttribute("href", "#");
				a.addEventListener('click', clicked);
				li.appendChild(a);
				ul.appendChild(li);
			}
		});
		document.getElementById("action-pdf").addEventListener("click", export_pdf);
	});
});

