(function() {

	if (typeof(module) !== 'undefined')
		E2.Loader = require('./loader.js').Loader;

	//helper functions
	function findOBJ(url) {
		for (var i = 0; i < url.length; i++) {
			var objRegex = (/(.obj)/g.test(url[i]));   //REGEX CHECK FOR .OBJ
			console.log("The RESULT OF THE CHECK IS: " + objRegex); // TRUE/FALSE
			console.log("OUR INTERATIONS ARE: " + url[i]); 	// LOG WHATS IN ARRAY/INTERATED

			if (objRegex == true) {
				var result = url[i];	// the obj string target
				console.log(result);
				console.log("OBJ FOUND");
				return result;
			}
		}
		console.log(url);		//ALTERNATIVE ERROR CATCH
		console.log("ERROR NO OBJ IN ARRAY!");
		return;
	}

	function findMTL(url) {
		for (var i = 0; i < url.length; i++) {
			var objRegex = (/(.mtl)/g.test(url[i]));   //REGEX CHECK FOR .MTL
			console.log("The RESULT OF THE CHECK IS: " + objRegex); // TRUE/FALSE
			console.log("OUR INTERATIONS ARE: " + url[i]); 	// LOG WHATS IN ARRAY/INTERATED

			if (objRegex == true) {
				var result = url[i];	// the mtl string target
				console.log(result);
				console.log("MTL FOUND");
				return result;
			}
		}
		console.log(url);		//ALTERNATIVE ERROR CATCH
		console.log("ERROR NO MTL IN ARRAY!");
		return;

	}

	function ModelLoader(url) {
		E2.Loader.apply(this, arguments)
		console.log("INPUT: "+ typeof url);
		if (typeof url === 'object') {    // typeof conventions object = array
			// if input into modelloader is array then proceed with function
			var ObrObj = findOBJ(url);
			var ObrMat = findMTL(url);
			console.log("ObrObj is a " + ObrObj);
			console.log("ObrMat is a " + ObrMat);
			this.loadObj(ObrObj, ObrMat);

		} else {
			console.log("LOADING NORMAL NON ARRAY OBJECTS");
			extname = url.substring(url.lastIndexOf('.')).toLowerCase();  //will continue to switch statement

			switch (extname) {
				case '.obj':
					console.log("loading this: " + url);
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

	ModelLoader.prototype.loadObj = function(url, arrmtl) {
		if (!arrmtl) { var arrmtl = "default"; } //optional parameter undef resolution
		console.log("These are the inputs" + url + " " + arrmtl);
		var that = this;
		if (url && arrmtl) { //if obj and mtl is passed...
			$.get('/stat' + arrmtl, function(data) {
				if (data.error === undefined) {
					// .mtl exists on server, load .obj and .mtl
					var mtlLoader = new THREE.MTLLoader()
					mtlLoader.setPath('')
					mtlLoader.setBaseUrl(arrmtl.substring(0, arrmtl.lastIndexOf('/')+1))
					mtlLoader.load(arrmtl, function(materials) {
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
		} else { //only one url is passed
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