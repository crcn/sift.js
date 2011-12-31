var stmt = require('./stmt');


var sift = module.exports = function(search, target) {

	var expr = stmt.parse( search );
	 
	var self = function(target) {
			
		var filtered = [];

		for(var i = target.length; i--;) {
			
			if(expr.test( target[i] )) filtered.push(target[i]);

		}

		return filtered;
	}

	self.statement = expr;

	if(target) return self(target);

	return self;
}


module.exports.statement = function(search) {
	
	return stmt.parse(search);

}


Array.prototype.sift = function() {
	return sift(search, this);
}