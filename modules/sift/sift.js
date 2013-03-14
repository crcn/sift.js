define([], function(require) {

    var __dirname = "modules/sift",
    __filename    = "modules/sift/sift.js",
    module        = { exports: {} },
    exports       = module.exports;

    /*
 * Sift
 * 
 * Copryright 2011, Craig Condon
 * Licensed under MIT
 *
 * Inspired by mongodb's query language 
 */


(function() {


	/**
	 */

	var _convertDotToSubObject = function(keyParts, value) {

		var subObject = {},
		currentValue = subObject;

		for(var i = 0, n = keyParts.length - 1; i < n; i++) {
			currentValue = currentValue[keyParts[i]] = {};
		}

		currentValue[keyParts[i]] = value;
		
		return subObject;
	}

	/**
	 */

	var _queryParser = new (function() {

		/**
		 * tests against data
		 */

		var priority = this.priority = function(statement, data) {

			var exprs = statement.exprs,
			priority = 0;

			//generally, expressions are ordered from least efficient, to most efficient.
			for(var i = 0, n = exprs.length; i < n; i++) {

				var expr = exprs[i],
				p;

				if(!~(p = expr.e(expr.v, _comparable(data), data))) return -1;

				priority += p;

			}


			return priority;
		}


		/**
		 * parses a statement into something evaluable
		 */

		var parse = this.parse = function(statement, key) {

			//fixes sift(null, []) issue
			if(!statement) statement = { $eq: statement };

			var testers = [];
				
			//if the statement is an object, then we're looking at something like: { key: match }
			if(statement.constructor == Object) {

				for(var k in statement) {

					//find the apropriate operator. If one doesn't exist, then it's a property, which means
					//we create a new statement (traversing) 
					var operator = !!_testers[k] ?  k : '$trav',

					//value of given statement (the match)
					value = statement[k],

					//default = match
					exprValue = value;

					//if we're working with a traversable operator, then set the expr value
					if(TRAV_OP[operator]) {


						//using dot notation? convert into a sub-object
						if(~k.indexOf(".")) {
							var keyParts = k.split(".");
							k = keyParts.shift(); //we're using the first key, so remove it

							exprValue = value = _convertDotToSubObject(keyParts, value);
						}
						
						//*if* the value is an array, then we're dealing with something like: $or, $and
						if(value instanceof Array) {
							
							exprValue = [];

							for(var i = value.length; i--;) {
								exprValue.push(parse(value[i]));		
							}

						//otherwise we're dealing with $trav
						} else {	
							exprValue = parse(value, k);
						}
					} 
					

					testers.push(_getExpr(operator, k, exprValue));

				}
								

			//otherwise we're comparing a particular value, so set to eq
			} else {
				testers.push(_getExpr('$eq', k, statement));
			}

			var stmt =  { 
				exprs: testers,
				k: key,
				test: function(value) {
					return !!~stmt.priority(value);
				},
				priority: function(value) {
					return priority(stmt, value);
				}
			};
			
			return stmt;
		
		}


		//traversable statements
		var TRAV_OP = {
			$and: true,
			$or: true,
			$nor: true,
			$trav: true,
			$not: true
		};


		function _comparable(value) {
			if(value instanceof Date) {
				return value.getTime();
			} else {
				return value;
			}
		}

		function btop(value) {
			return value ? 0 : -1;
		}

		var _testers = {

			/**
			 */

			$eq: function(a, b) {
				return btop(a.test(b));
			},

			/**
			 */

			$ne: function(a, b) {
				return btop(!a.test(b));
			},

			/**
			 */

			$lt: function(a, b) {
				return btop(a > b);
			},

			/**
			 */

			$gt: function(a, b) {
				return btop(a < b);
			},

			/**
			 */

			$lte: function(a, b) {
				return btop(a >= b);
			},

			/**
			 */

			$gte: function(a, b) {
				return btop(a <= b);
			},


			/**
			 */

			$exists: function(a, b) {
				return btop(a == !!b);
			},

			/**
			 */

			$in: function(a, b) {

				//intersecting an array
				if(b instanceof Array) {

					for(var i = b.length; i--;) {
						if(~a.indexOf(b[i])) return i;
					}	

				} else {
					return btop(~a.indexOf(b));
				}


				return -1;
			},

			/**
			 */

			$not: function(a, b) {
				if(!a.test) throw new Error("$not test should include an expression, not a value. Use $ne instead.");
				return btop(!a.test(b));
			},

			/**
			 */

			$type: function(a, b, org) {

				//instanceof doesn't work for strings / boolean. instanceof works with inheritance
				return org ? btop(org instanceof a || org.constructor == a) : -1;
			},

			/**
			 */


			$nin: function(a, b) {
				return ~_testers.$in(a, b) ? -1 : 0;
			},

			/**
			 */

			$mod: function(a, b) {
				return b % a[0] == a[1] ? 0 : -1;
			},

			/**
			 */

			$all: function(a, b) {

				for(var i = a.length; i--;) {
					if(b.indexOf(a[i]) == -1) return -1;
				}

				return 0;
			},

			/**
			 */

			$size: function(a, b) {
				return b ? btop(a == b.length) : -1;
			},

			/**
			 */

			$or: function(a, b) {

				var i = a.length, p, n = i;

				for(; i--;) {
					if(~priority(a[i], b)) {
						return i;
					}
				}

				return btop(n == 0);
			},

			/**
			 */

			$nor: function(a, b) {

				var i = a.length, n = i;

				for(; i--;) {
					if(~priority(a[i], b)) {
						return -1;
					}
				}

				return 0;
			},

			/**
			 */

			$and: function(a, b) {

				for(var i = a.length; i--;) {
					if(!~priority(a[i], b)) {
						return -1;
					}
				}

				return 0;
			},

			/**
			 */

			$trav: function(a, b) {

				if(b instanceof Array) {
					
					for(var i = b.length; i--;) {
						var subb = b[i];
						if(subb[a.k] && ~priority(a, subb[a.k])) return i;
					}

					return -1;
				}

				return b ? priority(a, b[a.k]) : -1;
			}
		}

		var _prepare = {
			
			/**
			 */

			$eq: function(a) {
				
				var fn;

				if(a instanceof RegExp) {
					return a;
				} else if (a instanceof Function) {
					fn = a;
				} else {
					
					fn = function(b) {	
						if(b instanceof Array) {		
							return ~b.indexOf(a);
						} else {
							return a == b;
						}
					}
				}

				return {
					test: fn
				}

			},
			
			/**
			 */
				
			 $ne: function(a) {
				return _prepare.$eq(a);
			 }
		};



		var _getExpr = function(type, key, value) {

			var v = _comparable(value);

			return { 

				//k key
				k: key, 

				//v value
				v: _prepare[type] ? _prepare[type](v) : v, 

				//e eval
				e: _testers[type] 
			};

		}


	})();


	var getSelector = function(selector) {

		if(!selector) {

			return function(value) {
				return value;
			};

		} else 
		if(typeof selector == 'function') {
			return selector;
		}

		throw new Error("Unknown sift selector " + selector);
	}

	var sifter = function(query, selector) {

		//build the filter for the sifter
		var filter = _queryParser.parse( query );
			
		//the function used to sift through the given array
		var self = function(target) {
				
			var sifted = [], results = [], value, priority;

			//I'll typically start from the end, but in this case we need to keep the order
			//of the array the same.
			for(var i = 0, n = target.length; i < n; i++) {

				value = selector(target[i]);

				//priority = -1? it's not something we can use.
				if(!~(priority = filter.priority( value ))) continue;

				//push all the sifted values to be sorted later. This is important particularly for statements
				//such as $or
				sifted.push({
					value: value,
					priority: priority
				});
			}

			//sort the values
			sifted.sort(function(a, b) {
				return a.priority > b.priority ? -1 : 1;
			});

			var values = Array(sifted.length);

			//finally, fetch the values & return them.
			for(var i = sifted.length; i--;) {
				values[i] = sifted[i].value;
			}

			return values;
		}

		//set the test function incase the sifter isn't needed
		self.test   = filter.test;
		self.score = filter.priority;
		self.query  = query;

		return self;
	}


	/**
	 * sifts the given function
	 * @param query the mongodb query
	 * @param target the target array
	 * @param rawSelector the selector for plucking data from the given target
	 */

	var sift = function(query, target, rawSelector) {

		//must be an array
		if(typeof target != "object") {
			rawSelector = target;
			target = undefined;
		}


		var sft  = sifter(query, getSelector(rawSelector));

		//target given? sift through it and return the filtered result
		if(target) return sft(target);

		//otherwise return the sifter func
		return sft;

	}


	//node.js?
	if((typeof module != 'undefined') && (typeof module.exports != 'undefined')) {
		
		module.exports = sift;

	} else 

	//browser?
	if(typeof window != 'undefined') {
		
		window.sift = sift;

	}

})();



    return module;
});