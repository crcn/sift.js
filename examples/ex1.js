var sift = require("../");

var topic = [{
	name: 'craig',
	age: 90001,
	tags:['coder', 'programmer', 'traveler', 'photographer'],
	address: {
		city: 'Minneapolis',
		state: 'MN',
		phone: '9999999999'
	},
	hobbies: [{
		name: 'programming',
		description: 'some desc'	
	},
	{
		name: 'cooking'
	},
	{
		name: 'photography',
		places: ['haiti','brazil','costa rica']
	},
	{
		name: 'backpacking'
	}]
},
{
	name: 'tim',
	age: 90001,
	tags: ['traveler', 'photographer'],
	address: {
		city: 'St. Paul',
		state: 'MN',
		phone: '765765756765'
	},
	hobbies: [{
		name: 'biking',
		description: 'some desc'	
	},
	{
		name: 'DJ'
	},
	{
		name: 'photography',
		places: ['costa rica']
	}]
}];

/*var r1 = sift({
	tags: 'photographer'
}, topic);*/

var r2 = sift({
	'hobbies.places': 'haiti'
}, topic);


var r3 = sift({
	'hobbies': { 'places': 'haiti' }
}, topic);

// console.log(r1.length);
console.log(r2.length);
console.log(r3.length);