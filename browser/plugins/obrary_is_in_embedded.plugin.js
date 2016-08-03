 (function() {
  var IsInEmbeddedPlugin = E2.plugins.obrary_is_in_embedded = function(core, node) {
		Plugin.apply(this, arguments)
  
		this.desc = 'Outputs true if the graph is currently viewed in an embedded system'
  
		this.input_slots = []
  
		this.output_slots = [{
                             name: 'embedded',
                             dt: E2.dt.BOOL,
                             desc: 'true if embedded, false if not'
                             }]
  
		this.outputs = {}
  }

  IsInEmbeddedPlugin.prototype = Object.create(Plugin.prototype)

  IsInEmbeddedPlugin.prototype.update_state = function() {

        this.outputs.embedded = IsInEmbeddedPlugin.prototype.isInEmbed();

  }

  IsInEmbeddedPlugin.prototype.isInEmbed = function(){
        if ( window.location !== window.parent.location ) {
            // The page is in an iframe
            return true;
        } else {
            // The page is not in an iframe
            return false;
        }
  
  }
  IsInEmbeddedPlugin.prototype.update_output = function(slot) {
		return this.outputs[slot.name]
  }

  IsInEmbeddedPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
            function refreshCallback(e) {
                // from webvr-manager:
                var Modes = {
                    UNKNOWN: 0,
                    // Not fullscreen, just tracking.
                    NORMAL: 1,
                    // Magic window immersive mode.
                    MAGIC_WINDOW: 2,
                    // Full screen split screen VR mode.
                    VR: 3,
                };
  
  
                this.updated = true
            }
  
            this.modeChangeListener = refreshCallback.bind(this)
  
            document.body.addEventListener('vrManagerModeChanged',
                                 this.modeChangeListener);
    }
  }

  
  IsInEmbeddedPlugin.prototype.destroy = function() {
		document.body.removeEventListener('vrManagerModeChanged',
                                          this.modeChangeListener)
  }
  
  
})()