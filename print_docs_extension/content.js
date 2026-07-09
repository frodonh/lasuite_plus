function exportTable(element) {
	if (!element) return "";
	let table = element.cloneNode(true);
	table.style = "";
	// When a table cell has a single paragraph, remove that paragraph
	for (let p of table.querySelectorAll("td > p:only-child")) {
		for (let q of p.childNodes) p.parentNode.appendChild(q);
		p.parentNode.removeChild(p);
	}
	// Move the first row in the table head
	let tr = table.querySelector("tbody tr");
	let thead = document.createElement("thead");
	thead.appendChild(tr);
	for (let td of tr.querySelectorAll("td")) {
		let th = document.createElement("th");
		th.innerHTML = td.innerHTML;
		tr.appendChild(th);
		tr.removeChild(td);
	}
	table.insertAdjacentElement("afterbegin", thead);
	return table.innerHTML;
}

function parseMeta(content) {
	let res = {};
	let field = null;
	let value = [];
	content.querySelectorAll("span.shiki").forEach(function(el) {
		if (el.style.color == "rgb(133, 232, 157)") {
			if (field && value.length > 0) {
				res[field] = value;
				value = [];
			}
			field = el.textContent;
		} else if (el.style.color == "rgb(158, 203, 255)" || el.style.color == "rgb(121, 184, 255)") {
			value.push(el.innerHTML);	
		}
	});
	return res;
}

function exportContent() {
	let html = "";
	let group = null;
	let meta = [];
	// Get the title of the document
	meta["title"] = document.querySelector('span[aria-label="Titre du document"]').innerHTML;
	// Convert the document to plain HTML
	document.querySelectorAll("div.bn-block-content").forEach(function(it){
		let typ = it.dataset["contentType"];
		let content = null;
		switch (typ) {
			case "codeBlock":
				// Read the metadata given in a YAML code block
				if (it.dataset["language"] != "yaml") break;
				content = it.querySelector(".bn-inline-content");
				meta = Object.assign(meta, parseMeta(content));
				break;
			case "heading":
				let level = it.dataset["level"] ?? '1';
				level = parseInt(level) + 1;
				if (group) {
					html += `</${group}>\n`;
					group = null;
				}
				content = it.querySelector(".bn-inline-content")?.innerHTML;
				if (content) html += `<h${level}>${content}</h${level}>`;
				break;
			case "quote":
				if (group) {
					html += `</${group}>\n`;
					group = null;
				}
				content = it.querySelector(".bn-inline-content")?.innerHTML;
				if (content) html += `<blockquote>${content}</blockquote>`;
				break;
			case "toggleListItem": case "bulletListItem":
				if (group != 'ul') {
					if (group) html += `</${group}>\n`;
					html += `<ul>\n`;
					group = 'ul';
				}
				content = it.querySelector(".bn-inline-content")?.innerHTML;
				if (content) html += `<li>${content}</li>`;
				break;
			case "numberedListItem":
				if (group != 'ol') {
					if (group) html += `</${group}>\n`;
					html += `<ol>\n`;
					group = 'ol';
				}
				content = it.querySelector(".bn-inline-content")?.innerHTML;
				if (content) html += `<li>${content}</li>`;
				break;
			case "paragraph":
				if (group) {
					html += `</${group}>\n`;
					group = null;
				}
				content = it.querySelector(".bn-inline-content")?.innerHTML;
				if (content) html += `<p>${content}</p>`;
				break;
			case "callout":
				if (group) {
					html += `</${group}>\n`;
					group = null;
				}
				content = it.querySelector(".bn-inline-content > div")?.innerHTML;
				if (content) html += `<div class="block">${content}</div>`;
				break;
			case "table":
				if (group) {
					html += `</${group}>\n`;
					group = null;
				}
				content = exportTable(it.querySelector("table"));
				if (content) html += `<table>${content}</table>`
				break;
		}
		html += "\n";
		html = html.replace('<br class="ProseMirror-trailingBreak">', '');
	});
	return { meta: meta, html: html }
}

function createTemplatedDocument() {
	// Create the page
	let doc = exportContent();
	// Open the page
	chrome.storage.local.set({ html: doc.html, meta: doc.meta },() => {
		chrome.runtime.sendMessage({action: "open_tab"});
	});
	//const blob = new Blob([new_page], {type: "text/html;charset=utf-8"});
	//window.open(URL.createObjectURL(blob), "_blank");
}

createTemplatedDocument();
