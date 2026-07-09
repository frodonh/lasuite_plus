let textarea = document.getElementById('css-code');
let namearea = document.getElementById('name-input');
let table = document.getElementById('list-templates').getElementsByTagName("tbody")[0];
let dialog = document.getElementById("edit-template");
let templates = [];
let current = null;

// Create an entry in the table of models
function create_entry(tentry) {
	let tr = document.createElement("tr");
	let td = document.createElement("td");
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
	tr.appendChild(td);
	td = document.createElement("td");
	td.innerHTML = tentry;
	tr.appendChild(td);
	table.appendChild(tr);
}

// Load the registered CSS when the page is opened
chrome.storage.local.get(['custom_css'], (result) => {
	if (result.custom_css) {
		templates = result.custom_css;
		for (const key in templates) create_entry(key);
	}
});

// Import a new CSS file
document.getElementById("file-input").addEventListener('change', (e) => {
	const file = e.target.files[0];
	if (!file) return;
	
	const reader = new FileReader();
	reader.onload = (evt) => {
		textarea.value = evt.target.result;
	};
	reader.readAsText(file);
});

// Save it in the extension storage
document.getElementById("save-btn").addEventListener('click', () => {
	dialog.close();
	const newname = document.getElementById("name-input").value;
	if (current) {
		delete templates[current.childNodes[1].textContent];
		current.childNodes[1].textContent = newname;
	}
	templates[newname] = textarea.value;
	chrome.storage.local.set({ custom_css: templates }, () => {
		create_entry(newname);
	});
});

// Cancel the edition without updating the storage
document.getElementById("cancel-btn").addEventListener('click', () => {
	dialog.close();
});

// Add a new template
document.getElementById("add-template").addEventListener("click", function() {
	namearea.value = "";
	textarea.value = "";
	current = null;
	dialog.showModal();
});

// Edit a template
function edit_template(event) {
	current = event.target.closest("tr");
	let source = current.childNodes[1].textContent;
	namearea.value = source;
	textarea.value = templates[source];
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
