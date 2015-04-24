/*
The MIT License (MIT)

Copyright (c) 2011 Lasse Jul Nielsen

Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
and associated documentation files (the "Software"), to deal in the Software without restriction, 
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial 
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var URL_DATA = '/data/';
var URL_GRAPHS = '/graph/';
var URL_GRAPH_FILES = URL_DATA+'graph/';

var E2 = {};
window.E2 = E2; // global scope so plugins can access it

E2.app = null;
E2.dom = {};
E2.plugins = {};
E2.slot_type = { input: 0, output: 1 };
E2.erase_color = '#ff3b3b';
E2.COLOR_COMPATIBLE_SLOT = '#080';

(function() {
var i = 0
E2.uid = function() {
	return parseInt(Date.now() + '' + i++)
}
})()

function Delegate(delegate, dt, count)
{
	this.delegate = delegate;
	this.dt = dt;
	this.count = count;
}

function AssetTracker(core)
{
	this.core = core;
	this.started = 0;
	this.completed = 0;
	this.failed = 0;
	this.listeners = [];
}

AssetTracker.prototype.add_listener = function(listener)
{
	this.listeners.push(listener);
};

AssetTracker.prototype.remove_listener = function(listener)
{
	this.listeners.remove(listener);
};

AssetTracker.prototype.signal_started = function()
{
	this.started++;
	this.signal_update();
};

AssetTracker.prototype.signal_completed = function()
{
	this.completed++;
	this.signal_update();
};

AssetTracker.prototype.signal_failed = function()
{
	this.failed++;
	this.signal_update();
};

AssetTracker.prototype.signal_update = function()
{
	var l = this.listeners;
	
	if(E2.dom.load_spinner)
		E2.dom.load_spinner.css('display', this.started === (this.completed + this.failed) ? 'none' : 'inherit');
	
	for(var i = 0, len = l.length; i < len; i++)
		l[i]();
};

function Core(vr_devices) {
	var that = this;

	E2.core = this
	
	E2.dt = this.datatypes = {
		FLOAT: { id: 0, name: 'Float' },
		SHADER: { id: 1, name: 'Shader' },
		TEXTURE: { id: 2, name: 'Texture' },
		COLOR: { id: 3, name: 'Color' },
		MATRIX: { id: 4, name: 'Matrix' },
		VECTOR: { id: 5, name: 'Vector' },
		CAMERA: { id: 6, name: 'Camera' },
		BOOL: { id: 7, name: 'Boolean' },
		ANY: { id: 8, name: 'Arbitrary' },
		MESH: { id: 9, name: 'Mesh' },
		AUDIO: { id: 10, name: 'Audio' },
		SCENE: { id: 11, name: 'Scene' },
		MATERIAL: { id: 12, name: 'Material' },
		LIGHT: { id: 13, name: 'Light' },
		DELEGATE: { id: 14, name: 'Delegate' },
		TEXT: { id: 15, name: 'Text' },
		VIDEO: { id: 16, name: 'Video' },
		ARRAY: { id: 17, name: 'Array' },
		OBJECT: { id: 18, name: 'Object' }
	};

	this._listeners = {};
	
	this.asset_tracker = new AssetTracker(this);
	this.renderer = new Renderer(vr_devices, '#webgl-canvas', this);

	this.active_graph_dirty = true;

	this.active_graph = this.root_graph = null
	this.graphs = []
	
	this.abs_t = 0.0;
	this.delta_t = 0.0;
	this.graph_uid = this.get_uid()
	this.uidCounter = 0

	this.pluginManager = new PluginManager(this, '/plugins');

	this.pluginManager.on('ready', function() {
		this.onPluginsLoaded()
	}.bind(this))

	this.aux_scripts = {};
	this.aux_styles = {};
	this.resolve_dt = []; // Table for easy reverse lookup of dt reference by id.
	this.audio_ctx = null;
	
	for(var i in this.datatypes) {
		var dt = this.datatypes[i];
		
		this.resolve_dt[dt.id] = dt;
	}
	
	// HTML5 audio context initialisation
	if(window.AudioContext)
		this.audio_ctx = new AudioContext();
	else if(window.webkitAudioContext)
		this.audio_ctx = new webkitAudioContext();
	else
		msg('NOTE: This host has no AudioContext support.');
}

Core.prototype.get_uid = function() {
	return parseInt(Date.now() + '' + this.uidCounter++, 10)
}

Core.prototype.update = function(abs_t, delta_t)
{
	this.abs_t = abs_t;
	this.delta_t = delta_t;
	
	this.renderer.begin_frame();
	this.root_graph.update(delta_t);
	this.renderer.end_frame();
			
	var dirty = this.active_graph_dirty;
			
	this.active_graph_dirty = false;
			
	return dirty; // Did connection state change?
};


Core.prototype.create_dialog = function(diag, title, w, h, done_func, open_func)
{
	var modal = bootbox.dialog({
		title: title,
		message: diag,
		buttons: {'Ok': function(){}}
	})

	function close()
	{
		modal.unbind();
		modal.remove();
	}

	function ok()
	{
		done_func();
		modal.modal('hide');
	}

	modal.on('show.bs.modal', function()
	{
		$('.modal-dialog', modal).css('width', w + 40);
	});

	modal.on('shown.bs.modal', function()
	{
		if(open_func)
			open_func();
	});

	modal.on('hidden.bs.modal', close);
	modal.modal({ keyboard: true });

	modal.on('keypress', function(e)
	{
		if(e.keyCode === 13)
		{
			if(e.target.nodeName !== 'TEXTAREA')
				ok();
		}
	})

	$('button:last', modal).click(ok);
};

Core.prototype.get_default_value = function(dt)
{
	var dts = this.datatypes;
	
	if(dt === dts.FLOAT)
		return 0.0;
	else if(dt === dts.COLOR)
		return vec4.createFrom(1, 1, 1, 1);
	else if(dt === dts.MATRIX) {
		var m = mat4.create();

		mat4.identity(m);
		return m;
	}
	else if (dt === dts.TEXTURE)
		return this.renderer.default_tex;
	else if(dt === dts.VECTOR)
		return vec3.createFrom(0.0, 0.0, 0.0);
	else if(dt === dts.CAMERA)
		return new Camera(this.renderer.context);
	else if(dt === dts.BOOL)
		return false;
	else if(dt === dts.MATERIAL)
		return new Material();
	else if(dt === dts.TEXT)
		return '';
	else if(dt === dts.ARRAY)
	{
		var a = new ArrayBuffer(0);
		
		a.stride = a.datatype = 1; // Uint8
		return a;
	}
	else if(dt === dts.OBJECT)
		return {};
	
	// Shaders, textures, scenes, light and delegates and ALL legally defaults to null.
	return null;
};

Core.prototype.serialise = function()
{
	var d = {};
	
	d.abs_t = Math.round(this.abs_t * Math.pow(10, 4)) / Math.pow(10, 4);
	d.active_graph = this.active_graph.uid;
	d.graph_uid = this.graph_uid;
	d.root = this.root_graph.serialise();
	
	return JSON.stringify(d, undefined, 4);
};

Core.prototype.deserialiseObject = function(d) {
	this.abs_t = d.abs_t;
	this.delta_t = 0.0;
	this.graph_uid = d.graph_uid;

	this.active_graph.destroy_ui();
	
	var graphs = this.graphs = [];
	
	this.root_graph = new Graph(this, null, null);
	this.root_graph.deserialise(d.root);
	this.graphs.push(this.root_graph);
	
	this.root_graph.patch_up(this.graphs);
	this.root_graph.initialise(this.graphs);
		
	this.active_graph = resolve_graph(this.graphs, d.active_graph); 
	
	if(!this.active_graph) {
		msg('ERROR: The active graph (ID: ' + d.active_graph + ') is invalid. Using the root graph.');
		this.active_graph = this.root_graph;
	}

	if (E2.dom.structure) {
		this.rebuild_structure_tree()
		
		if(this.active_graph.tree_node)
			this.active_graph.tree_node.activate();
		else
			this.root_graph.tree_node.activate();
	}
}

Core.prototype.deserialise = function(str) {
	return this.deserialiseObject(JSON.parse(str))
}

Core.prototype.rebuild_structure_tree = function() {
	function build(graph, name) {
		var nodes = graph.nodes;
		
		if (graph.parent_graph) {
			var ptn = graph.parent_graph.tree_node;
			var tnode = new TreeNode(ptn.tree, ptn, name, null);
			
			ptn.children.push(tnode);
			graph.tree_node = tnode;
			tnode.graph = graph;
		}
		
		for(var i = 0, len = nodes.length; i < len; i++) {
			var n = nodes[i];

			if(n.plugin.isGraph)
				build(n.plugin.graph, n.get_disp_name());
		}
	}

	E2.dom.structure.tree.reset();
	this.root_graph.tree_node = E2.dom.structure.tree.root;
	E2.dom.structure.tree.root.graph = this.root_graph;
	build(this.root_graph, 'Root');
	E2.dom.structure.tree.root.rebuild_dom();
};

Core.prototype.add_aux_script = function(script_url, onload)
{
	if(this.aux_scripts.hasOwnProperty(script_url)) {
		if (onload)
			onload()
		return
	}
	
	load_script('/plugins/' + script_url, function() {
		this.aux_scripts[script_url] = true;
		if (onload)
			onload()
	}.bind(this));
};

Core.prototype.add_aux_style = function(style_url)
{
	if(this.aux_styles.hasOwnProperty(style_url))
		return;
	
	load_style('/plugins/' + style_url);
	this.aux_styles[style_url] = true;
};

Core.prototype.onPluginsLoaded = function() {
	this.emit('ready');
};

Core.prototype.on = function(kind, cb)
{
	if (!cb)
		return;

	if (!this._listeners[kind])
		this._listeners[kind] = [];

	this._listeners[kind].push(cb);
}

Core.prototype.emit = function(kind)
{
	if (!this._listeners[kind])
		return;

	this._listeners[kind].forEach(function(cb)
	{
		cb();
	});
};


if (typeof(module) !== 'undefined') {
	module.exports = Core
}
