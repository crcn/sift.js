var sift = require('../'),
_ = require('underscore'),
vows = require('vows'),
assert = require('assert');


vows.describe('Sifter').addBatch({
	
	'An array': {
		
		'with shallow values': {

			topic: ['craig','john','jake','joe'],


			'has a sifted $in count of 3': function(topic) {
				assert.isTrue(sift({$in:['craig','john','joe']}, topic).length == 3);

			},

			'has a sifted $nin count of 1': function(topic) {
				assert.isTrue(sift({$nin:['craig','john','joe']}, topic).length == 1);
			},

			/**
			 */

			'has a sifted $all count of 1': function(topic) {
				assert.isTrue(sift({$all:['craig']}, topic).length == 1);
			}
		}
	}
}).run();