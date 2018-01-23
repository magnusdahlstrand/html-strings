var tabsAndNewlines = /[\t\n]+/g;
var leadingTrailingWhitespace = /(?:^\s)|(?:\s$)/;
var leadingWhitespace = /^\s+/;
var trailingWhitespace = /\s+$/;

(function(module, window) {

	var placeholderContent = 'placeholder';

	var defaultOpts = {};

	var boundEvents = {};

	var noop = () => {};

	function handleEvent(map, possibleTarget, ev) {
		// Recurse parent hierarchy and check
		// whether the elements have been bound.
		// If so, call their handlers.
		if(!possibleTarget) {
			return;
		}
		if(map.has(possibleTarget)) {
			return map.get(possibleTarget)(ev);
		}
		return handleEvent(map, possibleTarget.parentNode, ev)
	}

	var bindEvent = (function() {
		if(!(window && 'addEventListener' in window)) {
			return noop;
		}
		return function bindEvent(eventName, fragment, handler) {
			if(!(eventName in boundEvents)) {
				boundEvents[eventName] = new WeakMap();
				window.addEventListener(eventName, (ev) => {
					handleEvent(boundEvents[eventName], ev.target, ev);
				}, true);
			}
			// Keep track of the elements to allow for future matching
			forEach(
				fragment.children,
				child => boundEvents[eventName].set(child, handler)
			)
		}
	}())

	function forEach(list, cb) {
		try {
			return Array.prototype.forEach.call(list, cb);
		} catch(err) {
			console.info(list, cb);
			throw err
		}
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

	var contentToFragment = (function(document) {
		if(!document) {
			return function contentToString(content) {
				return content.join('');
			}
		}
		var contentHost = document.createElement('div');
		return function contentToFragment(content) {
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
	}(typeof document !== 'undefined' && document))

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
		if(!opts) {
			throw new Error(`htmlStringsKeys requires opts`);
		}
		var output = [];
		for(let [index, string] of Object.entries(strings)) {
			output.push(
				possiblyTrimString(string, index, strings.length),
				refine(keys[index])
			);
		}
		return refine(output)
			.then(fragment => {
				// Bind click events
				if(opts.click) {
					bindEvent('click', fragment, opts.click);
				}
				return fragment;
			});
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

	function insert(at, pending) {
		if(!at) {
			throw new Error(`insert requires a non-null first parameter`);
		}
		if(typeof at.append !== 'function') {
			throw new Error(`insert's first parameter needs an append function`);
		}
		Promise.resolve(pending)
			.then(fragment => at.append(fragment))
	}

	html.insert = insert;
	html.html = html;

	if(module) {
		module.exports = html;
	}
	else {
		Object.assign((window || global), {
			html,
		})
	}


}(
	typeof module !== 'undefined' && module,
	typeof window !== 'undefined' && window
))
