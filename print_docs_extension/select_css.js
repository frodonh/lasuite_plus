let textareas = {
	css: document.getElementById('css-code'),
	html: document.getElementById('html-code')
}
let namearea = document.getElementById('name-input');
let table = document.getElementById('list-templates').getElementsByTagName("tbody")[0];
let dialog = document.getElementById("edit-template");
let templates = {};
let current = null;

// Create an entry in the table of models
function create_entry(tentry) {
	let tr = document.createElement("tr");
	let td = document.createElement("td");
	if (!templates[tentry].base) {
		let button = document.createElement("button");
		button.classList.add("small");
		button.addEventListener('click', edit_template);
		button.setAttribute("title", "Éditer le modèle");
		button.innerHTML = '<img src ="edit.svg" />';
		td.appendChild(button);
		button = document.createElement("button");
		button.classList.add("small");
		button.setAttribute("title", "Supprimer le modèle");
		button.addEventListener('click', remove_template);
		button.innerHTML = '<img src ="remove.svg" />';
		td.appendChild(button);
	} else {
		let button = document.createElement("button");
		button.classList.add("small");
		button.enabled = false;
		button.setAttribute("title", "Modèle pré-enregistré par l'administrateur");
		button.innerHTML = '<img src ="lock.svg" />';
		td.appendChild(button);
	}
	tr.appendChild(td);
	td = document.createElement("td");
	td.innerHTML = tentry;
	tr.appendChild(td);
	table.appendChild(tr);
}

// Load the registered CSS when the page is opened
chrome.storage.local.get(['custom_css'], (result) => {
	if (result.custom_css) {
		Object.assign(templates, result.custom_css);
		for (const key in templates) create_entry(key);
	}
});

// Event manager for buttons to import files from the disk
function importFile(event) {
	const file = event.target.files[0];
	if (!file) return;
	let type = event.target.dataset["type"];
	const reader = new FileReader();
	reader.onload = (evt) => {
		textareas[type].value = evt.target.result;
	};
	reader.readAsText(file);
}

// Event listeners to import files from the disk
for (const type of ['css', 'html']) 
	document.getElementById("file-" + type + "-input").addEventListener('change', importFile);

// Save it in the extension storage
document.getElementById("save-btn").addEventListener('click', () => {
	dialog.close();
	const newname = document.getElementById("name-input").value;
	if (current) {
		delete templates[current.childNodes[1].textContent];
	}
	templates[newname] = {
		css: textareas['css'].value,
		html: textareas['html'].value
	}
	chrome.storage.local.set({ custom_css: templates }, () => {
		if (current) current.childNodes[1].textContent = newname;
		else create_entry(newname);
	});
});

// Cancel the edition without updating the storage
document.getElementById("cancel-btn").addEventListener('click', () => {
	dialog.close();
});

// Add a new template
document.getElementById("add-template").addEventListener("click", function() {
	namearea.value = "";
	for (const type of ['css', 'html']) textareas[type].value = "";
	current = null;
	dialog.showModal();
});

// Edit a template
function edit_template(event) {
	current = event.target.closest("tr");
	let source = current.childNodes[1].textContent;
	namearea.value = source;
	for (const type of ['css', 'html']) textareas[type].value = templates[source][type];
	dialog.showModal();
}

// Remove a template
function remove_template(event) {
	let tr = event.target.closest("tr");
	let source = tr.childNodes[1].textContent;
	delete templates[source];
	chrome.storage.local.set({ custom_css: templates }, () => {
		tr.parentNode.removeChild(tr);
	});
}

// Export all templates to a JSON file (which can be used as the base_templates.json file for preconfigured templates)
document.getElementById("export-btn").addEventListener('click', function() {
	const json = JSON.stringify(templates, null, 2);
	const blob = new Blob([json], {type: "application/json"});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "base_templates.json";
	a.style.display = "none";
	document.body.appendChild(a);
	a.click();
	setTimeout(()=> {
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, 100);
});
