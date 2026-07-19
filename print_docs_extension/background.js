const docs_url = "docs.numerique.gouv.fr/docs";

chrome.runtime.onInstalled.addListener(async (details) => {
	if (details.reason != chrome.runtime.OnInstalledReason.INSTALL && details.reason != chrome.runtime.OnInstalledReason.UPDATE) return;
	try {
		const file_url = chrome.runtime.getURL("base_templates.json");
		const content = await fetch(file_url);
		const data = await content.json();
		for (let key in data) data[key].base = true;
		await chrome.storage.local.set({custom_css: data});
	} catch (error) {
		console.error("Modèles de base introuvables", error);
	}
});

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

function changeBadge(tab, active) {
	if (active) {
		chrome.action.setBadgeText({text: "✓", tabId: tab.id});
		chrome.action.setBadgeBackgroundColor({color: "#10B981", tabId: tab.id});
		chrome.action.setBadgeTextColor({color: "#FFFFFF", tabId: tab.id});
		chrome.action.setIcon({
			tabId: tab.id,
			path: {
				"48": "print-docs-48.png",
				"128": "print-docs-128.png"
			}
		});
	} else {
		chrome.action.setBadgeText({text: "", tabId: tab.id});
		chrome.action.setIcon({
			tabId: tab.id,
			path: {
				"48": "print-docs-inactive-48.png",
				"128": "print-docs-inactive-128.png"
			}
		});
	}
} 

function setBadge(tab) {
	if (!tab || !tab.id || !tab.url) return;
	if (tab.url.includes(docs_url)) {
		changeBadge(tab, true);
		return;
	}
	if (tab.url.startsWith('blob:https://docs.numerique.gouv.fr')) {
		chrome.scripting.executeScript({
			target: {tabId: tab.id },
			func: () => { return document.documentElement.dataset["printdocs"]; }
		}, (resp) => {
			const pdid = resp?.[0]?.result;
			if (pdid) changeBadge(tab, pdid);
		});
	}
}

chrome.tabs.onUpdated.addListener((_tab_id, change_info, tab) => {
	if (change_info.status === 'loading' || change_info.status === 'complete' || tab.url) setBadge(tab);
});

chrome.tabs.onActivated.addListener((active_info) => {
	chrome.tabs.get(active_info.tabId, (tab) => {
		if (chrome.runtime.lastError) return;
		setBadge(tab);
	});
});

