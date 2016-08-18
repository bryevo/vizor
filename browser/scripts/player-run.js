(function() {

window.playVizorFile = function playVizorFile() {
	var $canvas = $('canvas[data-graph-url]')
    var url = $canvas.data('graph-url')
    return E2.app.player.loadAndPlay(url)
}

function onCoreReady() {
	var $canvas = $('canvas[data-graph-url]')
	var autoplay = (window.Vizor) ? window.Vizor.autoplay : true
	var url = $canvas.data('graph-url')

	E2.app.player.on_update()

	E2.track({
		event: 'playerOpened',
		path: url
	})

	if (autoplay) {
		E2.app.player.loadAndPlay(url, autoplay)
	}

	$(window).trigger('vizorLoaded')
}

$(document).ready(function()  {
	CreatePlayer(onCoreReady)
})

// postMessage API for setting variables in embedded files
window.addEventListener('message', function(e) {
	function send(message) {
		e.source.postMessage(message, e.origin)
	}

	switch(e.data.command) {
		case 'getVariables':
			send({
				name: e.data.name,
				value: E2.app.player.getVariables(e.data.name)
			})
			break;
		case 'setVariables':
			E2.app.player.setVariables(e.data.name);
			break;
	}
}, false)


})()

