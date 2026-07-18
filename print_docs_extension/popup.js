const docs_url = "docs.numerique.gouv.fr/docs";

async function clicked(event) {
	const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
	if (!tab || !tab.url || !tab.url.includes(docs_url)) {
		console.log("L'extension ne fonctionne que sur l'outil Docs de la Suite numérique.");
		return;
	}
	const tname = event.target.innerHTML;
	chrome.scripting.executeScript({
		target: { tabId: tab.id },
		files: ["content.js"]
	}, () => {
		setTimeout(() => {
			chrome.tabs.sendMessage(tab.id, {
				action: "apply_template",
				template: tname
			});
		}, 100);
	});
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
