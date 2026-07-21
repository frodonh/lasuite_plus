const docs_url = "docs.numerique.gouv.fr/docs";
import { PDFDocument, PDFName, PDFNumber, PDFString } from './pdf-lib.esm.min.js';

let current_bookmarks = [];
let intercepting = true;

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

chrome.runtime.onMessage.addListener((message, _sender, response) => {
	if (message.action = "PREPARE_INTERCEPTION") {
		current_bookmarks = message.bookmarks;
		intercepting = true;
		response({status: "ready"});
	}
});

chrome.downloads.onChanged.addListener(async (delta) => {
	if (!intercepting || !delta.state || delta.state.current !== "complete") return;
	intercepting = false;
	const [download] = await chrome.downloads.search({id: delta.id});
	if (!download || !download.mime?.includes("pdf")) return;
	try {
		const response = await fetch(download.finalUrl || download.url);
		const raw_array_buffer = await response.arrayBuffer();
		const enriched_pdf = await inject_bookmarks(raw_array_buffer, current_bookmarks);
		const blob = new Blob([enriched_pdf], {type: 'application/pdf'});
		const reader = new FileReader();
		const data_url = reader.readAsDataURL(blob);
		const filename = download.filename;
		await chrome.downloads.cancel(download.id);
		await chrome.downloads.erase({id: download.id});
		chrome.downloads.download({
			url: data_url,
			filename: filename,
			saveAs: false
		});
	} catch (error) {
		console.error("Erreur lors de l'injection des signets :", error);
	}
});

async function inject_bookmarks(raw, bookmarks) {
	const pdfDoc = await PDFDocument.load(raw);
	const context = pdfDoc.context;
	const pages = pdfDoc.getPages();
	if (!bookmarks || bookmarks.length === 0) return await pdfDoc.save();
	const outlinesDict = context.obj({ Type: 'Outlines' });
	const outlinesRef = context.register(outlinesDict);
	let firstRef = null, lastRef = null, prevRef = null;
	bookmarks.forEach((item, index) => {
		const targetPage = pages[item.pageIndex] || pages[pages.length - 1];
		const itemDict = context.obj({
			Title: PDFString.of(item.title),
			Parent: outlinesRef,
			Dest: [targetPage.ref, 'XYZ', null, PDFNumber.of(item.y), null],
		});
		const itemRef = context.register(itemDict);
		if (index === 0) {
			firstRef = itemRef;
		} else {
			const prevDict = context.lookup(prevRef);
			prevDict.set(PDFName.of('Next'), itemRef);
			itemDict.set(PDFName.of('Prev'), prevRef);
		}
		lastRef = itemRef;
		prevRef = itemRef;
	});
	outlinesDict.set(PDFName.of('First'), firstRef);
	outlinesDict.set(PDFName.of('Last'), lastRef);
	outlinesDict.set(PDFName.of('Count'), PDFNumber.of(bookmarks.length));
	pdfDoc.catalog.set(PDFName.of('Outlines'), outlinesRef);
	return await pdfDoc.save(); 
}

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

