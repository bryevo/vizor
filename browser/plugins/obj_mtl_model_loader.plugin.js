(function() {
    function progress() {
        console.log('Loading progress', input_array, arguments)
    }
    var input_array = []; //GLOBAL ARRAY
    var input_obj;
    var input_mtl;

    function errorHandler(err) {
        msg('ERROR: '+err.toString())
    }

    var ArraytoOBJLoaderPlugin = E2.plugins.obj_mtl_model_loader = function(core) {
        AbstractThreeLoaderObjPlugin.apply(this, arguments);

        this.input_slots = [
            {name: 'object', dt: core.datatypes.TEXT},
            {name: 'material', dt: core.datatypes.TEXT}
        ];
    }

    ArraytoOBJLoaderPlugin.prototype = Object.create(AbstractThreeLoaderObjPlugin.prototype);

    ArraytoOBJLoaderPlugin.prototype.getDefaultMaterials = function() {
        return [new THREE.MeshBasicMaterial()]
    }

    ArraytoOBJLoaderPlugin.prototype.getDefaultGeometries = function() {
        return [new THREE.Geometry()]
    }

    ArraytoOBJLoaderPlugin.prototype.update_input = function(slot, data) {
        if (slot.index === 0) {
            if (data)
                input_obj = data;                               //push slots to array
            console.log("OBJ is: " + input_obj);

        }
        if (slot.index === 1) {
            if (data)
                input_mtl = data;
            console.log("MTL is: " + input_mtl);

        }
    };

    ArraytoOBJLoaderPlugin.prototype.update_state = function() {
        if (!this.dirty)
            return;

        if (!input_obj || !input_mtl){
            return;
        }
        
        input_array = [input_obj, input_mtl];
        var that = this;

        this.geometries = this.getDefaultGeometries();
        this.materials = this.getDefaultMaterials();
        //
        //E2.core.assetLoader.loadAsset('model', this.state.url).then(function(asset) {

        E2.core.assetLoader
            .loadAsset('model', input_array)
            .then(function(asset) {
                that.onObjLoaded(asset.geometries, asset.materials)
            });
        console.log("The input array:" + input_array);

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
