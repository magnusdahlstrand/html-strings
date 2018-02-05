# html-strings

Prototype javascript templates using template-literals.

## Try

Clone the repo and load index.html in your browser (doesn't need a server), or run `node test.js`.

## Templates

Components are represented as functions using tagged template literals:

```
var view = () => html`<em>All DOM</em> is allowed`
```

The `html` function is a [tag for template strings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates), and returns a Promise. The template's expressions can reference Promises or direct values, and when all have resolved the template Promise resolves with a DocumentFragment containing the rendered DOM nodes. If running in an environment where the DOM is not available, the Promise instead resolves with a string.

The template string is rendered to DOM nodes by being set as the innerHTML of a temporary element, and all resulting nodes (text & DOM nodes) are moved over to a document fragment. The fragment can then be appended or prepended to another node as required:

```
var fragment = view();
parentNode.append(fragment)
```

## Events

The `html` function can also be called with an object as its only parameter. When called with an options object it returns a new function to be used as the template tag. This makes it possible to set the context of the template, e.g. for event binding:

```
var opts = {
    click: (ev) => console.log('click!', ev)
};
html(opts)`<button>Click me</button>`
```
