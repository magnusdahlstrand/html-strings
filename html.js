var whitespace = /[\t\n]+/g;

function refine(something) {
	if(something instanceof Promise) {
		return something;
	}
	if(something instanceof Array) {
		return Promise.all(something)
		.then(result => Promise.resolve(result.join('')))
	}
	if(typeof something === 'function') {
		return something();
	}
	if(typeof something === 'undefined' ||
		typeof something === 'boolean') {
		return '';
	}
	if(typeof something === 'string') {
		something.replace(whitespace, '');
	}
	return something;
}

function html(strings, ...keys) {
	var output = [];
	for(let [i, string] of Object.entries(strings)) {
		output.push(string, refine(keys[i]));
	}
	return refine(output);
}

module.exports = html;