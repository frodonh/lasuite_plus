const docs_url = "docs.numerique.gouv.fr/docs";

chrome.action.onClicked.addListener((tab) => {
	if (tab.url && tab.url.includes(docs_url)) {
		chrome.scripting.executeScript({
			target: { tabId: tab.id },
		files: ["content.js"]
		});
	} else {
		console.log("L'extension ne fonctionne que sur l'outil Docs de la Suite numérique.");
	}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === 'get_template') {
		chrome.storage.local.get(['custom_css'], (result) => {
			const templates = result['custom_css'] || {};
			const css = templates[message.name] || '';
			sendResponse(css);
		});
		return true;
	} else if (message.action === 'get_templates') {
		chrome.storage.local.get(['custom_css'], (result) => {
			const templates = result['custom_css'] || {};
			const list = Object.keys(templates) || {};
			sendResponse(list);
		});
		return true;
	} else if (message.action === 'open_tab') {
		chrome.tabs.create({url: "exported_page.htm"});
	}
});

function setBadge(tab) {
	if (!tab || !tab.id || !tab.url) return;
	if (tab.url.includes(docs_url)) {
		chrome.action.setBadgeText({text: "✓", tabId: tab.id});
		chrome.action.setBadgeBackgroundColor({color: "#10B981", tabId: tab.id});
		chrome.action.setBadgeTextColor({color: "#FFFFFF", tabId: tab.id});
		chrome.action.setIcon({
			tabId: tab.id,
			path: {
				"16": "print-docs.svg",
				"32": "print-docs.svg",
				"48": "print-docs.svg",
				"128": "print-docs.svg"
			}
		});
	} else {
		chrome.action.setBadgeText({text: "", tabId: tab.id});
		chrome.action.setIcon({
			tabId: tab.id,
			path: {
				"16": "print-docs-inactive.svg",
				"32": "print-docs-inactive.svg",
				"48": "print-docs-inactive.svg",
				"128": "print-docs-inactive.svg"
			}
		});
	}
}

chrome.tabs.onUpdated.addListener((tab_id, change_info, tab) => {
	if (change_info.status === 'loading' || change_info.status === 'complete' || tab.url) setBadge(tab);
});

chrome.tabs.onActivated.addListener((active_info) => {
	chrome.tabs.get(active_info.tabId, (tab) => {
		if (chrome.runtime.lastError) return;
		setBadge(tab);
	});
});

