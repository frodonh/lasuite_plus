window.PagedConfig = {
	auto: false
};

if (typeof Paged!="undefined") {
	class MyHandler extends Paged.Handler {
		constructor(chunker,polisher,caller) {
			super(chunker,polisher,caller);
		}

		afterRendered(pages) {
			add_button();
		}
	}
	Paged.registerHandlers(MyHandler);
}

function add_button() {
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
	let sel=document.createElement('select');
	sel.id = "select-format";
	chrome.runtime.sendMessage({action: "get_templates"}, (response) => {
		if (!response) return;
		response.forEach((name, index) => {
			let op = document.createElement('option');
			if (index == 0) {
				op.setAttribute("selected", 1);
				// Select the default stylesheet
				chrome.runtime.sendMessage({action: "get_template", name: name}, (response) => {
					if (!response) return;
					document.getElementById("custom-template").innerHTML = response;
				});
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


document.addEventListener('DOMContentLoaded', function(event) {
	const urlParams = new URLSearchParams(window.location.search);
	const tname = urlParams.get('modele');
	chrome.storage.local.get(['html', 'meta'], (result) => {
		let header = document.body.getElementsByTagName('header')[0];
		header.insertAdjacentHTML('afterend', result.html);
		header.getElementsByTagName('h1')[0].innerHTML = result.meta.title.join('\n');
		document.querySelector('head > title').textContent = result.meta.title.join('\n');
		for (const [key, val] of Object.entries(result.meta)) document.body.dataset[key] = val.join(", ");
		chrome.runtime.sendMessage({action: "get_template", name: tname}, (response) => {
			if (!response) return;
			let cssel = document.getElementById("custom-template");
			if (!cssel) {
				cssel = document.createElement("style");
				cssel.id = "custom-template";
				document.head.appendChild(cssel);
			}
			cssel.innerHTML = response;
			console.log(document.documentElement.innerHTML);
			if (typeof Paged == "undefined") {
				add_button();
			} else {
				window.PagedPolyfill.preview().then(() => {
					add_button();
				});
			}
		});
	});
});

