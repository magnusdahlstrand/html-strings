var html = require('./html');

function template({title, text}) {
	return html`
		<h1>${title}</h1>
		<p>${text || 'Some text'}</p>
	`
}

function button({label, click}) {
	return html({click})`<button>${label}</button>`
}

template({
	title: 'Server side rendering',
	text: html`Some text with a button: ${button({
		label: 'Label',
		// The click event is not bound on the server
		click: (ev) => console.log('click!', ev)
	})}`
})
.then(rendered => {
	console.log(rendered);
})

