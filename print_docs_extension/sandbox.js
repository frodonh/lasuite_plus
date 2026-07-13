window.addEventListener("message", (event) => {
	const { code, value, id } = event.data;
	try {
		const user_function = new Function('html', code);
		const result = user_function(value);
		event.source.postMessage({id, result, success:true}, event.origin);
	} catch (error) {
		event.source.postMessage({id, error: error.message, success:false}, event.origin);
	}
});
