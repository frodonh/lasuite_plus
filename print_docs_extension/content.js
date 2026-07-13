function exportTable(element) {
	if (!element) return "";
	let table = element.cloneNode(true);
	table.style = "";
	// When a table cell has a single paragraph, remove that paragraph
	for (let p of table.querySelectorAll("td > p:only-child")) {
		for (let q of p.childNodes) p.parentNode.appendChild(q);
		p.parentNode.removeChild(p);
	}
	// If the first row contains cells with a strong text, it is considered to be a title row. In this case, move the first row in the table head
	if (table.querySelector("tbody tr:first-child td strong")) {	
		let tr = table.querySelector("tbody tr");
		let thead = document.createElement("thead");
		thead.appendChild(tr);
		for (let td of tr.querySelectorAll("td")) {
			let th = document.createElement("th");
			th.innerHTML = td.innerHTML.replace(/<\/?strong>/,'');
			tr.appendChild(th);
			tr.removeChild(td);
		}
		table.insertAdjacentElement("afterbegin", thead);
	}
	// For each cell in the first column, if it contains a strong text, it is considered to be a title cell.
	for (let p of table.querySelectorAll("tbody > tr")) {
		let title = p.querySelector("td:first-child strong");
		if (title) {
			let th = document.createElement("th");
			th.innerHTML = title.innerHTML;
			p.removeChild(p.childNodes[0]);
			p.insertAdjacentElement('afterbegin', th);
		}
	}
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
	let meta = {};
	// Get the title of the document
	meta["title"] = [ document.querySelector('span[aria-label="Titre du document"]').innerHTML ];
	console.log(meta);
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
				if (content) {
					let match = content.match(/^\s*<strong>(.*?)<\/strong>\s*?<br>(.*)*/);
					if (match) {
						html += `<div class="block" data-blockname="${match[1]}">${match[2]}</div>`;
					} else {
						html += `<div class="block">${content}</div>`;
					}
				}
				break;
			case "table":
				if (group) {
					html += `</${group}>\n`;
					group = null;
				}
				content = exportTable(it.querySelector("table"));
				if (content) html += `<table>${content}</table>`;
				break;
			case "image":
				content = it.querySelector("img.bn-visual-media")?.getAttribute("src");
				if (!content) break;
				const legend = (it.dataset["caption"]) ? ('<div class="caption">' + it.dataset["caption"] + "</div>") : "";
				const manwidth = (it.dataset["preview-width"]) ? (' style="width: ' + it.dataset["preview-width"] + ';"') : '';
				html += `<figure><img src="${content}" ${manwidth} />${legend}</figure>`;
				break;
		}
		html += "\n";
		html = html.replace('<br class="ProseMirror-trailingBreak">', '');
	});
	return { meta: meta, html: html }
}

function createToc(html) {
	html = '<div id="toc-chapter"><h2>Sommaire</h2><div id="toc"></div></div>' + html;
	let doc = new DOMParser().parseFromString(html, "text/html");
	const toclist = doc.getElementById("toc");
	if (!toclist) return html;
	const headings = doc.querySelectorAll('h2, h3');
	let counter = 0;
	headings.forEach((heading) => {
		if (!heading.id) {
			const slug = heading.textContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
			counter++;
			heading.id = slug || `auto-${counter}`;
		}
		const li = doc.createElement('li');
		li.classList.add(`toc-${heading.tagName.toLowerCase()}`);
		const a = doc.createElement('a');
		a.href = `#${heading.id}`;
		const span_title = doc.createElement('span');
		span_title.classList.add('titre-texte');
		span_title.textContent = heading.textContent;
		a.appendChild(span_title);
		const span_page = doc.createElement('span');
		span_page.classList.add('page-num');
		span_page.setAttribute('data-target', `#${heading.id}`);
		li.appendChild(a);
		li.appendChild(span_page);
		toclist.appendChild(li);
	});
	return doc.body.innerHTML;
}

function createTemplatedDocument() {
	// Create the page
	let doc = exportContent();
	console.log(doc);
	// Create dynamic content
	let html = createToc(doc.html);
	// Open the page
	chrome.storage.local.set({ html: html, meta: doc.meta },() => {
		chrome.runtime.sendMessage({action: "open_tab"});
	});
	//const blob = new Blob([new_page], {type: "text/html;charset=utf-8"});
	//window.open(URL.createObjectURL(blob), "_blank");
}

createTemplatedDocument();
