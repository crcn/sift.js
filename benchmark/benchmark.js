var sift = require('../');
require('colors'),
Benchmark = require('benchmark');

var suite = new Benchmark.Suite,
numbers = [],
objects = [];


for(var i = 1000; i--;) {
	numbers.push(i * 10);
}




var names = ['Craig','Tim','John','Jake','Jane','Sarah','Zack','Josh','Sam','Zoe','Rick','Jenny','Anne'];
var ages = [18,20,21,40,50,60,25,32,11,66,65,99];
var states = ['MN','CA','NY','NJ','TX','FL','NM','SD','ND'];
var cooks = [true, false];
var tags = [
['cooking','soccer','tennis','espresso','kindle','costa rica'],
['cooking','brazil','tennis'],
['espresso','kindle','tacos'],
['jazz','super'],
['blarg'],
['eating','programming','sleeping']];


for(i = 1000; i--;) {
	objects.push({
		id: i,
		name: names[i % names.length],
		age: ages[i % ages.length],
		cooks: cooks[i % cooks.length],
		address: {
			state: states[i % states.length],
			tags: tags[i % tags.length]
		}
	})
}


console.log('Starting benchmark');


suite.add('Controlled array $in', function() {
	
	var $in = [1000,500], sifted = [];

	for(var i = numbers.length; i--;) {

		if($in.indexOf(numbers[i]) > -1) sifted.push(numbers[i]);

	}	

}).
add('Sift $in intersect', function() {
	sift({$in: [1000, 500]}, numbers)
}).
add('Sift $gt and $lt', function() {
	sift({ $gt: 100, $lt: 1000 }, numbers);
}).
add('Sift for id gt 500', function() {
	sift({ id: {$gt: 500}}, objects);
}).
add('Sift for tags: cooking, brazil', function() {
	sift({
		address: { tags: { $in: ['cooking','brazil'] } }
	}, objects);
}).
add('Sift for tags: cooking, brazil, and age lt 30', function() {
	sift({
		age: { $lt: 30 },
		address: { tags: { $in: ['cooking','brazil'] } }
	}, objects);
}).
on('cycle', function(event, bench) {
	console.log(String(event.target));
}).
on('complete', function() {
}).
run({'async':true});


