var tabsAndNewlines = /[\t\n]+/g;
var leadingTrailingWhitespace = /(?:^\s)|(?:\s$)/;
var leadingWhitespace = /^\s+/;
var trailingWhitespace = /\s+$/;

(function(module, window) {

	var placeholderContent = 'placeholder';

	var parent = module || window || global;
	var defaultOpts = {};

	function forEach(list, cb) {
		return Array.prototype.forEach.call(list, cb);
	}

	function recurseReplacePlacehoders(node, placeholders) {
		// Node or node's childen or neither could be a placeholder
		if(node instanceof Comment && node.textContent === placeholderContent) {
			// The node itself is a placeholder
			var placeholder = placeholders.shift();
			node.replaceWith(placeholder);
		}
		else if(node.childNodes) {
			// A child node could be a placeholder?
			forEach(
				node.childNodes,
				(child) => recurseReplacePlacehoders(child, placeholders)
			)
		}
	}

	var contentHost = document.createElement('div');
	function contentToFragment(content) {
		if(!(content instanceof Array)) {
			throw new Error(`contentToFragment only accepts arrays`);
		}
		var placeholders = [];
		// Replace nodes with placeholder comments
		contentHost.innerHTML = content
			.map(piece => {
				if(piece instanceof Node) {
					placeholders.push(piece);
					return `<!--${placeholderContent}-->`;
				}
				return piece;
			})
			.join('');
		var fragment = document.createDocumentFragment();
		// Append all child nodes to fragment
		fragment.append(...contentHost.childNodes);
		// Replace placeholder comments recursively
		recurseReplacePlacehoders(fragment, placeholders);
		return fragment;
	}

	function refine(something) {
		if(something instanceof Promise) {
			return something;
		}
		if(something instanceof Array) {
			return Promise.all(something)
			.then(result => contentToFragment(result))
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

	function htmlStringsKeys(strings, keys, opts) {
		var output = [];
		for(let [index, string] of Object.entries(strings)) {
			output.push(
				possiblyTrimString(string, index, strings.length),
				refine(keys[index])
			);
		}
		// TODO: If opts defines click then register any
		// elements found in the output with the event delegator
		return refine(output);
	}

	function htmlOpts(opts) {
		return (strings, ...keys) => htmlStringsKeys(strings, keys, opts);
	}

	function html(first, ...keys) {
		if(first instanceof Array) {
			return htmlStringsKeys(first, keys, defaultOpts);
		}
		else if(typeof first === 'object') {
			return htmlOpts(first);
		}
		throw new Error(`html: invalid signature "${typeof first}"`)
	}

	function insert(node, pending) {
		if(!(node instanceof Node)) {
			throw new Error(`insert requires a Node as first parameter`);
		}
		Promise.resolve(pending)
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
