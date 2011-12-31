var sift = require('../');
require('colors'),
Benchmark = require('benchmark');

var suite = new Benchmark.Suite,
numbers = [];


for(var i = 1000; i--;) {
	numbers.push(i * 10);
}


suite.add('Controlled array $in', function() {
	
	var $in = [1000,500], sifted = [];

	for(var i = numbers; i--;) {

		if($in.indexOf(numbers[i]) > -1) sifted.push(numbers[i]);

	}	

}).
add('Sift $in intersect', function() {
	sift({ $in: [1000,500]}, numbers);
}).
add('Sift $gt and $lt', function() {
	sift({ $gt: 100, $lt: 1000 }, numbers);
}).
add('Sift object', function() {
	sift({
		name: { $exists: false },
		address: {
			phone: { $ne: '9999999999' }
		},
	}, [{
		address: {
			phone: '438402342'
		}
	},
	{
		name: 'Craig',
		address: {
			phone: '4284023'
		}
	}])
}).
on('cycle', function(event, bench) {
	console.log(String(bench));
}).
on('complete', function() {
}).
run({'async':true});


