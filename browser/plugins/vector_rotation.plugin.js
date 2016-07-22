E2.p = E2.plugins["vector_direction"] = function(core, node)
{
	this.desc = 'Outputs the rotation direction to orient the supplied A vector to target vector.'
	
	this.input_slots = [ 
	{ 
		name: 'A', 
		dt: core.datatypes.VECTOR, 
		desc: 'The first operand.', 
		def: core.renderer.vector_origin 
	}, 
	{ 	name: 'target', 
		dt: core.datatypes.VECTOR, 
		desc: 'The second operand.', 
		def: core.renderer.vector_origin 
	} 
						];
	
	this.output_slots = [
	{ 	name: 'rotation vector', 
		dt: core.datatypes.VECTOR, 
		desc: 'Emits the direction from A to target.', 
		def: ore.renderer.vector_origin  
	}
						];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.vector_a = data;
	else if(slot.index === 1)
		this.vector_b = data;
};	

E2.p.prototype.update_state = function()
{
	this.result = this.vector_a.direction(this.vector_b)
};

E2.p.prototype.update_output = function()
{
	return this.result;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.vector_a = new THREE.Vector3(0, 0, 0)
		this.vector_b = new THREE.Vector3(0, 0, 0)
		this.result = new THREE.Vector3(0, 0, 0)
	}
};
