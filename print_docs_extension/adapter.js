window.PagedConfig = {
	auto: false
};

if (typeof Paged!="undefined") {
	class MyHandler extends Paged.Handler {
		constructor(chunker,polisher,caller) {
			super(chunker,polisher,caller);
		}

		afterRendered(_pages) {
			add_button();
		}
	}
	Paged.registerHandlers(MyHandler);
}

function add_button(tname) {
	// Add stylesheets
	style=document.createElement('style');
	style.textContent='@media print { #select-box { display: none; } }';
	document.head.appendChild(style);

	// Add template selector
	let div=document.createElement('div');
	div.id = "select-box";
	div.style.position='fixed';
	div.style.top='0';
	div.style.left='0';
	div.style.zIndex = 30;
	let sel=document.createElement('select');
	sel.id = "select-format";
	chrome.runtime.sendMessage({action: "get_templates"}, (response) => {
		if (!response) return;
		response.forEach((name, _index) => {
			let op = document.createElement('option');
			if (tname && name == tname) {
				op.setAttribute("selected", 1);
				sel.value = name;
			}
			op.textContent = name;
			sel.appendChild(op);
		});
	});
	div.appendChild(sel);
	sel.addEventListener('change', function(e) {
		const tname = e.target.value;
		const url = chrome.runtime.getURL('exported_page.htm');
		window.location.href = url + '?modele=' + encodeURIComponent(tname);
	});
	document.body.appendChild(div);
}


document.addEventListener('DOMContentLoaded', function(_event) {
	const urlParams = new URLSearchParams(window.location.search);
	const tname = urlParams.get('modele');
	chrome.storage.local.get(['html', 'meta'], (result) => {
		chrome.runtime.sendMessage({action: "get_template", name: tname}, (response) => {
			if (!response) return;
			// Fill the body with the template HTML, substituting "${var}" expressions with the matching metadata variable
			document.body.innerHTML = response.html.replace(/\$\{([^}]*)\}/, (_match, p1, _offset, _string, _groups) => {return result.meta[p1] || '';})
			// Fill the title in the HTML metadata head
			document.querySelector('head > title').textContent = result.meta.title.join('\n');
			// Then add the converted HTML document just before the end of the body
			document.body.insertAdjacentHTML('beforeend', result.html);
			// Add all user-provided metadata as data-attributes of body
			for (const [key, val] of Object.entries(result.meta)) {
				document.body.dataset[key] = val.join(", ");
			} 
			// Add the template CSS
			let cssel = document.getElementById("custom-template");
			if (!cssel) {
				cssel = document.createElement("style");
				cssel.id = "custom-template";
				document.head.appendChild(cssel);
			}
			cssel.innerHTML = response.css;
			// Pass the document through Paged.js
			if (typeof Paged == "undefined") add_button(tname);
			else window.PagedPolyfill.preview().then(() => { add_button(tname); });
		});
	});
});

