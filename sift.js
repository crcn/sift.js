/*
 * Sift
 * 
 * Copryright 2011, Craig Condon
 * Licensed under MIT
 *
 * Inspired by mongodb's query language 
 */


(function() {
	

	var _queryParser = new (function() {

		/**
		 * tests against data
		 */

		var test = this.test = function(statement, data) {

			var exprs = statement.exprs;

			for(var i = exprs.length; i--;) {

				var expr = exprs[i];
				if(!expr.e(expr.v, _comparable(data))) return false;
			}

			return true;
		}


		/**
		 * parses a statement into something evaluable
		 */

		var parse = this.parse = function(statement, key) {

			var testers = [], weight = 0;
				
			if(statement)
			//if the statement is an object, then we're looking at something like: { key: match }
			if(statement.constructor == Object) {
				

				for(var k in statement) {

					//find the apropriate operator. If one doesn't exist, then it's a property, which means
					//we create a new statement (traversing) 
					var operator = WEIGHT_FACTOR[k] ?  k : '$trav',

					//value of given statement (the match)
					value = statement[k],

					//default = match
					exprValue = value;

					//if we're working with a traversable operator, then set the expr value
					if(TRAV_OP[operator]) {
						
						//*if* the value is an array, then we're dealing with something like: $or, $and
						if(value instanceof Array) {
							
							exprValue = [];

							for(var i = value.length; i--;) {

								exprValue.push(parse(value[i]));
									
							}

							_orderExprs(exprValue);

						//otherwise we're dealing with $trav
						} else {
							
							exprValue = parse(statement[k], k);
						}
					} 
					

					testers.push(_getExpr(operator, k, exprValue));
				}
								

			//otherwise we're comparing a particular value, so set to eq
			} else {

				testers.push(_getExpr('$eq', k, statement));

			}

			//combine the tester weights so we can order based on speed.
			for(var i = testers.length; i--;) {

				weight += testers[i].w;	

			}


			var stmt =  { exprs: _orderExprs(testers), 
	            k: key,
	            w: weight,
	            test: function(value) {
	            	
	                return test(stmt, value);

	            } 
        	};
            
            return stmt;
		
		}

		/** 
		 * hydrates a statement with the most recent data
		 */

		/*var hydrate = this.hydrate = function(statement, data) {
			//TODO
		}*/

		var WEIGHT_FACTOR = {
			$eq: 1,
			$ne: 2,
			$exists: 2,
			$lt: 2,
			$lte: 2,
			$gt: 2,
			$gte: 2,
			$size: 3,
			$mod: 3,
			// $type: 4,
			$in: 4,
			$nin: 4,
			$all: 5,
			$or: 6,
			$nor: 6,
			$and: 7,
			$trav: 8
		};

		//traversable statements
		var TRAV_OP = {
			$and: true,
			$or: true,
			$trav: true,
		}


		function _comparable(value) {

			if(value instanceof Date) {

				return value.getTime();
			
			} else {

				return value;
			
			}
		}


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

				return value ? value.w : 0;

			}
		};


		function weight(value) {

			return weigh[typeof value](value);

		}


		var _testers = {

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

				//intersecting an array
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

				return !_testers.$in(a, b);

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

				return b ? a == b.length : false;

			},

			/**
			 */

			$or: function(a, b) {

				for(var i = a.length; i--;) {

					if(test(a[i], b)) {

						return true;

					}

				}

				return false;

			},

			/**
			 */

			$and: function(a, b) {

				for(var i = a.length; i--;) {

					if(!test(a[i], b)) {

						return false;

					}
				}

				return true;
			},

			/**
			 */

			$trav: function(a, b) {

				if(b instanceof Array) {
					
					for(var i = b.length; i--;) {
						
						var subb = b[i];


						if(subb[a.k] && test(a, subb[a.k])) return true;
					}

					return false;
				}


				return b ? test(a, b[a.k]) : false;

			}
		}


		var _getExpr = function(type, key, value) {

			return { 

				//weight
				w: WEIGHT_FACTOR[type] * 100 + weight(value), 

				//type
				t: type,

				//k key
				k: key, 

				//v value
				v: _comparable(value), 

				//e eval
				e: _testers[type] 
			};

		}

		var _orderExprs = function(stmt) {

			stmt.sort(function(a, b) {

				//if a weight is < than b weight, shift a to the end (executed first)
				return a.w < b.w ? 1 : -1;

			});

			return stmt;
		}

	})();


	//sifts a given array
	var sift = function(query, target) {

		//build the filter for the sifter
		var filter = _queryParser.parse( query );
		 	
		//the function used to sift through the given array
		var self = function(target) {
				
			var sifted = [];

			//I'll typically start from the end, but in this case we need to keep the order
			//of the array the same.
			for(var i = 0, n = target.length; i < n; i++) {

				if(filter.test( target[i] )) sifted.push(target[i]);

			}

			return sifted;
		}

		//set the test function incase the sifter isn't needed
		self.test = filter.test;

		//target given? sift through it and return the filtered result
		if(target) return self(target);

		//otherwise return the sifter func
		return self;

	}


	//node.js?
	if((typeof module != 'undefined') && (typeof module.exports != 'undefined')) {
		
		module.exports = sift;

	} else 

	//browser?
	if(typeof window != 'undefined') {
		
		window.sift = sift;

	}

	/**
		Array.prototype.sift = function() {

			return sift(search, this);

		}
	 */


})();

