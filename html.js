var tabsAndNewlines = /[\t\n]+/g;
var leadingTrailingWhitespace = /(?:^\s)|(?:\s$)/;
var leadingWhitespace = /^\s+/;
var trailingWhitespace = /\s+$/;

(function(module, window) {

	var parent = module || window || global;

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
			something
				.replace(tabsAndNewlines, '')
				.replace(leadingTrailingWhitespace, '');
		}
		return something;
	}

	function possiblyTrimString(string, index, count) {
		// The conditions below use `==` since functions
		// processing template strings are called with
		// an array indexed by strings and not numbers
		// due to being the result of Object.keys()
		if(index == '0') {
			return string.replace(leadingWhitespace, '')
		}
		if(index == count - 1) {
			// trim last strings trailing space
			return string.replace(trailingWhitespace, '')
		}
		return string;
	}

	function html(strings, ...keys) {
		var output = [];
		for(let [index, string] of Object.entries(strings)) {
			output.push(
				possiblyTrimString(string, index, strings.length),
				refine(keys[index])
			);
		}
		return refine(output);
	}

	var contentHost = document.createElement('div');
	function contentToFragment(content) {
		contentHost.innerHTML = content;
		var fragment = document.createDocumentFragment();
		// Keep reference to elements in case of event binding
		var childElements = [...contentHost.children];
		// Append childNodes as they include text nodes
		fragment.append(...contentHost.childNodes);
		return fragment;
	}

	function insert(node, pending) {
		if(!(node instanceof Node)) {
			throw new Error(`insert requires a Node as first parameter`);
		}
		Promise.resolve(pending)
			.then(contentToFragment)
			.then(fragment => root.append(fragment))
	}

	Object.assign(parent, {
		html,
		insert,
	})

}(
	typeof module !== 'undefined' && module,
	typeof window !== 'undefined' && window
))
