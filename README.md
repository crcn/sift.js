
### Example

```javascript

var sift = require('sift');

//$or
var sifted = sift({$in: ['hello','world']}, ['hello','sifted','array!']); //['hello']

//this works too
var sifter = sift({$in: ['hello','world']});
sifter(['hello','sifted','array!']) //[hello]



```


### Supported operators:


#### $in

#### $nin

#### $exists

#### $gte

#### $gt

#### $lte

#### $lt

#### $ne

#### $eq

#### $exists

#### $mod

#### $all

#### $and

#### $or

#### $size


### Deep Searching:


```javascript

var people = [{
	name: 'craig',
	age: 90001,
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




var sifted = sift({		

	hobbies: {
		name: 'photography',
		places: {$in: ['brazil']}
	},

	address: {
		state: 'MN'
	}

}, topic);

```


### To Do

- $type
- regexp 
- function testing



