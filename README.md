# html

Templates are functions returning promises using tagged template literals:

```
var view = ({allowed = true}) => html`<em>All DOM</em> is allowed`
```

The template string is set as innerHTML of an element, and its childNodes are moved over to a document fragment until insertion.

Node.append & Node.prepend are used to insert the nodes from the document fragment:

```
parentRootNode.append(...fragment.children)
```

The templating function `html` supports passing an object with options in, and if so returns a configured template function:

```
html(opts)`<div>template</div>`
```

# Events

html can support binding elements on the elements it produces. Instead of react-style "onSomething" binding the html function is passed callbacks for events. Each call to html resoves to a promise which when resolves creates DOM nodes for its content. If the html function has received an options object with parameters for events it will keep references to created elements in a WeakMap which will be used for matching the event target and its parents against a global delegate handler running in the capturing phase.

```
html({
    click: (ev) => console.log('click!', ev)
})`<button>Click me</button>`
```
