chrome.runtime.onMessage.addListener((message, _sender, _response) => {
	if (message.action == "generate_pdf_bookmarks") {
		const bookmarks = [];
		const pagedPages = document.querySelectorAll('.pagedjs_sheet');
		const pageHeightPt = 841.89; 
		const pxToPt = 72 / 96;

		// Extract precise Y coordinates of headings in pages
		pagedPages.forEach((pageEl, pageIndex) => {
			const pageRect = pageEl.getBoundingClientRect();

			pageEl.querySelectorAll('h1, h2, h3').forEach((header) => {
				const headerRect = header.getBoundingClientRect();
				const topPx = headerRect.top - pageRect.top;

				bookmarks.push({
					title: header.innerText.trim(),
					pageIndex: pageIndex,
					y: Math.max(0, pageHeightPt - (topPx * pxToPt))
				});
			});
		});

		// Tell the background script it must prepare to intercept the PDF
		chrome.runtime.sendMessage({
			action: 'PREPARE_INTERCEPTION',
			bookmarks: bookmarks
		}, () => {
			window.print();
		});
	}
	return true;
});

