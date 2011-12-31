module.exports = new (function() {

	/**
	 * tests against data
	 */

	var test = this.test = function(statement, data) {

		var exprs = statement.exprs;


		for(var i = exprs.length; i--;) {

			var expr = exprs[i];

			if(!expr.e(expr.v, comparable(data[expr.k]), data)) return false;
		}

		return true;
	}


	/**
	 * parses a statement into something evaluable
	 */

	var parse = this.parse = function(statement, ops) {

		return builder.parse(statement, ops);
	
	}


	/** 
	 * hydrates a statement with the most recent data
	 */

	var hydrate = this.hydrate = function(statement, data) {
		//TODO
	}


	function comparable(value) {

		if(value instanceof Date) {

			return value.getTime();
		
		} else {

			return value;
		
		}
	}



	var WEIGHT_FACTOR = {
		$eq: 1,
		$ne: 2,
		$exists: 2,
		$lt: 2,
		$gt: 2,
		$size: 3,
		// $type: 4,
		$in: 4,
		$nin: 4,
		$all: 5,
		$or: 6,
		$nor: 6,
		$and: 7
	};


	var weigh = {

		'undefined': function() {

			return 0;

		},

		//regexp
		'function': function() {

			return 100;
		
		},

		'boolean': function(value) {
			
			return 0;
		
		},

		'string': function(value) {

			return value.length;
		
		},

		'number': function(value) {

			return value;

		},

		'object': function(value) {

			if(value instanceof Array) {

				return weigh.array(value);

			} else {

				return weigh.complex(value);

			}

		},

		'array': function(value) {

			var total = 0;

			for(var i = value.length; i--;) {

				total += weight(value[i]);

			}

			return total;

		},

		'complex': function(value) {

			return value;

		}
	};


	function weight(value) {

		return weigh[typeof value](value);

	}


	var testers = {

		/**
		 */

		$eq: function(a, b) {

			return a == b;

		},

		/**
		 */

		$ne: function(a, b) {

			return a != b;

		},

		/**
		 */

		$lt: function(a, b) {

			return a > b;

		},

		/**
		 */

		$gt: function(a, b) {

			return a < b;

		},

		/**
		 */

		$lte: function(a, b) {

			return a >= b;

		},

		/**
		 */

		$gte: function(a, b) {

			return a <= b;

		},


		/**
		 */

		$exists: function(a, b) {

			return a == !!b;

		},

		/**
		 */

		$in: function(a, b) {

			if(b instanceof Array) {

				for(var i = b.length; i--;) {

					if(a.indexOf(b[i]) > -1) return true;

				}	

			} else {

				return a.indexOf(b) > -1;

			}

		},

		/**
		 */


		$nin: function(a, b) {

			return !testers.$in(a, b);

		},

		/**
		 */

		$mod: function(a, b) {

			return b % a[0] == a[1];

		},

		/**
		 */

		$all: function(a, b) {

			for(var i = a.length; i--;) {

				var v = a[i];

				if(b.indexOf(v) == -1) return false;

			}

			return true;

		},

		/**
		 */

		$size: function(a, b) {

			return a.length == b.length;

		},

		/**
		 */

		$or: function(a, b, data) {

			for(var i = a.length; i--;) {

				if(test(a[i], data)) {

					return true;

				}

			}

			return false;

		},

		/**
		 */

		$and: function(a, b, data) {

			for(var i = a.length; i--;) {

				if(!test(a[i], data)) {

					return false;

				}
			}

			return true;

		}
	}


	var getExpr = function(type, key, value) {

		//w weight
		//t type
		//k key
		//v value
		//e eval
		return { w: WEIGHT_FACTOR[type] * 100 + weight(value), 
			t: type,
			k: key, 
			v: comparable(value), 
			e: testers[type] };

	}

	var orderExprs = function(stmt) {

		stmt.sort(function(a, b) {

			return a.w < b.w;

		})

		return stmt;
	}

	var builder = {

		/**
		 */

		parse: function(statement, ops) {

			var ordered = [], expr;

			for(var key in statement) {

				var expr = (key.substr(0, 1) == '$' ? builder.group : builder.single)(key, statement[key]);

				if(expr instanceof Array) {

					ordered = ordered.concat(expr);

				} else {

					ordered.push(expr);

				}

			}

			var weight = 0;

			for(var i = ordered.length; i--;) {

				weight += ordered[i].w;	

			}

			var stmt =  { exprs: orderExprs(ordered), 
	            ops: ops, 
	            w: weight,
	            test: function(value) {

	                return test(stmt, value);

	            } 
        	};
            
            return stmt;

		},


		/**
		 */

		group: function(key, value) {

			var stmts = [];


			for(var i = value.length; i--;) {

				stmts.push(builder.parse(value[i]));

			}


			return getExpr(key, key, orderExprs(stmts));
		},

		/**
		 */

		single: function(key, value) {

			return typeof value == 'object' ? builder.complex(key, value): getExpr('$eq', key, value);

		},

		/**
		 */

		complex: function(key, value) {

			var testers = [];

			for(var k in value) {

				if(k.substr(0,1) == '$') {

					var fact = WEIGHT_FACTOR[k];

					if(fact) testers.push(getExpr(k, key, value[k]));
				}
			}	

			return testers;
		}
	}

})();