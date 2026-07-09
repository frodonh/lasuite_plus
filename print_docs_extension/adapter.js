function add_button() {
	// Add stylesheets
	let style = document.createElement('style');
	style.id = "custom-template";
	document.head.appendChild(style);
	let link = document.createElement('link');
	link.setAttribute("rel", "stylesheet");
	link.setAttribute("href", "interface.css");
	document.head.appendChild(link);
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
		chrome.runtime.sendMessage({action: "get_template", name: tname}, (response) => {
			if (!response) return;
			document.getElementById("custom-template").innerHTML = response;
		});
	});
	document.body.appendChild(div);

}

document.addEventListener('DOMContentLoaded', function(event) {
	chrome.storage.local.get(['html', 'meta'], (result) => {
		let header = document.body.getElementsByTagName('header')[0];
		header.insertAdjacentHTML('afterend', result.html);
		header.getElementsByTagName('h1')[0].innerHTML = result.meta.title;
		document.querySelector('head > title').textContent = result.meta.title;
		for (const [key, val] of Object.entries(result.meta)) document.body.dataset[key] = val.join(", ");
	});
	if (typeof Paged == "undefined") {
		add_button();
	} else {
		window.PagedPolyfill.preview();
	}
});

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
