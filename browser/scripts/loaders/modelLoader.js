(function() {

if (typeof(module) !== 'undefined')
	E2.Loader = require('./loader.js').Loader;



	function findOBJ(url) {
	var i;
	for (i = 0; i < url.length; i++) {
		if (/(.obj)/g.test(url[i]) == true) {
			console.log("OBJ FOUND");
			var result = url[i];
			console.log(result);
			return result;
		}
		else {
			console.log("ERROR NO OBJ IN ARRAY!");
			return;
		}
	}
}//end function declaration
	function findMTL(url) {
		var i;
		for (i = 0; i < url.length; i++) {
			if (/(.mtl)/g.test(url[i]) == true) {
				console.log("MTL FOUND");
				return url[i];
			}
			else {
				console.log("ERROR NO MTL IN ARRAY!");
				return;
			}
		}
	}//end function declaration

function ModelLoader(url) {
	E2.Loader.apply(this, arguments)
	console.log("INPUT: "+ typeof url);
		if (typeof url === 'object') {    // typeof conventions object = array
			// if input into modelloader is array then proceed with function
			console.log("function start");
			var OBRARY = findOBJ(url);
			this.loadObj(OBRARY);

			findMTL(url);
			console.log("function completed");

		}
		else {
			console.log("LOADING NORMAL NON ARRAY OBJECTS");
			extname = url.substring(url.lastIndexOf('.')).toLowerCase();  //will continue to switch statement

			switch (extname) {
				case '.obj':
					console.log("loading this non obrary obj" + url);
					this.loadObj(url);
					console.log(url);
					break;
				case '.js':
				case '.json':
				case '.dae':
				case '.fbx':
				case '.gltf':
					this.loadObject3D(url)
					break;
				default:
					msg('ERROR: Don`t know how to load', url, extname)
					break;
			}
		} //else completer
}

ModelLoader.prototype = Object.create(E2.Loader.prototype)

ModelLoader.prototype.loadObject3D = function(url) {
	var loader = new THREE.JSONLoader()
	loader.crossOrigin = 'Anonymous'
	loader.load(url,
		this.onJsonLoaded.bind(this),
		this.progressHandler.bind(this),
		this.errorHandler.bind(this)
	)
}

ModelLoader.prototype.loadObj = function(url) {
	var that = this;
	var mtlUrl = url.replace('.obj', '.mtl');

	$.get('/stat' + mtlUrl, function(data) {
		if (data.error === undefined) {
			// .mtl exists on server, load .obj and .mtl
			var mtlLoader = new THREE.MTLLoader()
			mtlLoader.setPath('')
			mtlLoader.setBaseUrl(mtlUrl.substring(0,mtlUrl.lastIndexOf('/')+1))
			mtlLoader.load(mtlUrl, function(materials) {
				var objLoader = new THREE.OBJLoader()
				objLoader.setMaterials(materials)
				objLoader.load(url,
					that.onObjLoaded.bind(that),
					that.progressHandler.bind(that),
					that.errorHandler.bind(that))
			}, that.progressHandler.bind(that), that.errorHandler.bind(that))
		}
		else {
			// no .mtl on server, load .obj only
			var loader = new THREE.OBJLoader()
			loader.crossOrigin = 'Anonymous'
			loader.load(url,
				that.onObjLoaded.bind(that),
				that.progressHandler.bind(that),
				that.errorHandler.bind(that))
		}
	})
}
	
ModelLoader.prototype.onObjLoaded = function(geoms, mats) {
	this.emit('loaded', {
		geometries: geoms,
		materials: mats
	})
}
	
ModelLoader.prototype.onJsonLoaded = function(geoms, mats) {
	return this.onObjLoaded([geoms], mats)
}

E2.Loaders.ModelLoader = ModelLoader

if (typeof(module) !== 'undefined') {
	module.exports.ModelLoader = ModelLoader
}

})()
