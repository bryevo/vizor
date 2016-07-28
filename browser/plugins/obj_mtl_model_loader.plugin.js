(function() {
    function progress() {
        console.log('Loading progress', input_array, arguments)
    }
var input_array = []; //GLOBAL ARRAY

    function errorHandler(err) {
        msg('ERROR: '+err.toString())
    }

    var ArraytoOBJLoaderPlugin = E2.plugins.obj_mtl_model_loader = function(core) {
        AbstractThreeLoaderObjPlugin.apply(this, arguments)

        this.input_slots = [
            {name: 'array', dt: core.datatypes.ANY, array: true}
        ];
    }

    ArraytoOBJLoaderPlugin.prototype = Object.create(AbstractThreeLoaderObjPlugin.prototype);

    ArraytoOBJLoaderPlugin.prototype.getDefaultMaterials = function() {
        return [new THREE.MeshBasicMaterial()]
    }

    ArraytoOBJLoaderPlugin.prototype.getDefaultGeometries = function() {
        return [new THREE.Geometry()]
    }

    // ThreeLoaderModelPlugin.prototype.create_ui = function() {
    // 	var inp = makeButton('Change', 'No model selected.', 'url');
    // 	var that = this;
    //
    // 	inp.click(function() {
    // 		var oldValue = that.state.url;
    // 		var newValue;
    //
    // 		FileSelectControl.createSceneSelector(that.state.url).onChange(function(v) {
    // 				newValue = that.state.url = v;
    // 				that.state_changed(null);
    // 				that.state_changed(inp);
    // 				that.updated = true;
    //
    // 				E2.track({
    // 					event: 'assetChanged',
    // 					plugin: 'ThreeLoaderModelPlugin',
    // 					url: v
    // 				})
    // 			})
    // 			.on('closed', function() {
    // 				if (newValue === oldValue)
    // 					return;
    //
    // 				that.undoableSetState('url', newValue, oldValue)
    // 			})
    // 	});
    //
    // 	return inp
    // };
    ArraytoOBJLoaderPlugin.prototype.update_input = function(slot, data) {
        if (slot.index === 0) {
            if (data)
                input_array = data;
            console.log("Array is: " + input_array);  //check what array contains

        }
    };

    ArraytoOBJLoaderPlugin.prototype.update_state = function() {
        if (!this.dirty)
            return;

        if (!input_array) {
            console.log("Please reconnect");
            return;
        }
        var that = this;

        this.geometries = this.getDefaultGeometries();
        this.materials = this.getDefaultMaterials();
        //
        //E2.core.assetLoader.loadAsset('model', this.state.url).then(function(asset) {
        console.log(" DATA SUCCESSFULLY GIVEN TO INPUT ARRAY IN objmtlloader");

        E2.core.assetLoader
            .loadAsset('model', input_array)
            .then(function(asset) {
                that.onObjLoaded(asset.geometries, asset.materials)
            })
        console.log("loading array complete");

        this.dirty = false
    }
    ArraytoOBJLoaderPlugin.prototype.update_output = function(slot) {
        if (slot.index === 0) {
            return this.geometries;
        }
        if (slot.index === 1) {
            return this.materials
        }
    }

})()
