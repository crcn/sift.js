## MongoDB inspired array filtering [![Build Status](https://secure.travis-ci.org/crcn/sift.js.png)](https://secure.travis-ci.org/crcn/sift.js)

For extended documentation, checkout http://docs.mongodb.org/manual/reference/operator/query/

## Features:

- Supported operators: [$in](#in), [$nin](#nin), [$exists](#exists), [$gte](#gte), [$gt](#gt), [$lte](#lte), [$lt](#lt), [$eq](#eq), [$neq](#neq), [$mod](#mod), [$all](#all), [$and](#and), [$or](#or), [$nor](#nor), [$not](#not), [$size](#size), [$type](#type), [$regex](#regex)
- Regexp searches
- Function filtering
- sub object searching
- dot notation searching
- Supports node.js, and web
- Small (2 kb minified) library
- Custom Expressions 



## Node.js Examples

```javascript

var sift = require('sift');

//intersecting arrays
var sifted = sift({ $in: ['hello','world'] }, ['hello','sifted','array!']); //['hello']

//regexp filter
var sifted = sift(/^j/, ['craig','john','jake']); //['john','jake']


//A *sifter* is returned if the second parameter is omitted
var siftPeople = sift({

	//you can also filter against functions
	name: function(value) {
		return value.length == 5;
	}
});

//filtered: [{ name: 'craig' }]
siftPeople([{
	name: 'craig',
},
{
	name: 'john'
},
{
	name: 'jake'
}]);


//you can test *single values* against your custom sifter
siftPeople.test({ name: 'sarah' }); //true
siftPeople.test({ name: 'tim' }); //false\
```

## Browser Examples
```html
<html>
	<head>
		<script src="https://raw.github.com/crcn/sift.js/master/sift.min.js" type="text/javascript"></script>
		<script type="text/javascript">
			//regexp filter
			var sifted = sift(/^j/, ['craig','john','jake']); //['john','jake']
		</script>
	</head>
	<body>
	</body>
</html>
```

## API

### .sift(filter[, array][, selectorFn])

- `filter` - the filter to use against the target array
- `array` - sifts against target array. Without this, a function is returned
- `selectorFn` - selector for the values within the array. 

With an array:

```javascript
sift({$exists:true}, ['craig',null]); //['craig']
```

Without an array, a sifter is returned:

```javascript
var siftExists = sift({$exists:true});

siftExists(['craig',null]); //['craig']
```

With a selector:

```javascript
var sifter = sift({$exists:true}, function(user) {
	return !!user.name;
});


sifter([
	{
		name: "Craig"
	},
	{
		name: null
	}
])
```

With your sifter, you can also **test** values:

```javascript
siftExists.test(null); //false
siftExists.test('craig'); //true
```


## Supported Operators:

See MongoDB's [advanced queries](http://www.mongodb.org/display/DOCS/Advanced+Queries) for more info.

### $in

array value must be *$in* the given query:

Intersecting two arrays:
 
```javascript
//filtered: ['Brazil']
sift({ $in: ['Costa Rica','Brazil'] }, ['Brazil','Haiti','Peru','Chile']); 
``` 

Here's another example. This acts more like the $or operator:

```javascript
sift({ location: { $in: ['Costa Rica','Brazil'] } }, { name: 'Craig', location: 'Brazil' });
```

### $nin

Opposite of $in:

```javascript
//filtered: ['Haiti','Peru','Chile']
sift({ $nin: ['Costa Rica','Brazil'] }, ['Brazil','Haiti','Peru','Chile']); 
``` 

### $exists

Checks if whether a value exists:

```javascript
//filtered: ['Craig','Tim']
sift({ $exists: true }, ['Craig',null,'Tim']); 
``` 

You can also filter out values that don't exist

```javascript
//filtered: [{ name: 'Craig', city: 'Minneapolis' }]
sift({ city: { $exists: false } }, [ { name: 'Craig', city: 'Minneapolis' }, { name: 'Tim' }]); 
```

### $gte

Checks if a number is >= value:

```javascript
//filtered: [2, 3]
sift({ $gte: 2 }, [0, 1, 2, 3]); 
```

### $gt

Checks if a number is > value:

```javascript
//filtered: [3]
sift({ $gt: 2 }, [0, 1, 2, 3]); 
```

### $lte

Checks if a number is <= value.

```javascript
//filtered: [0, 1, 2]
sift({ $lte: 2 }, [0, 1, 2, 3]); 
```

### $lt

Checks if number is < value.

```javascript
//filtered: [0, 1]
sift({ $lt: 2 }, [0, 1, 2, 3]); 
```

### $eq

Checks if query == value. Note that **$eq can be omitted**. For **$eq**, and **$neq**

```javascript
//filtered: [{ state: 'MN' }]
sift({ state: {$eq: 'MN' }}, [{ state: 'MN' }, { state: 'CA' }, { state: 'WI' }); 
```

Or:

```javascript
//filtered: [{ state: 'MN' }]
sift({ state: 'MN' }, [{ state: 'MN' }, { state: 'CA' }, { state: 'WI' }); 
```

### $ne

Checks if query != value.

```javascript
//filtered: [{ state: 'CA' }, { state: 'WI'}] 
sift({ state: {$ne: 'MN' }}, [{ state: 'MN' }, { state: 'CA' }, { state: 'WI' }); 
```

### $mod

Modulus:

```javascript
//filtered: [300, 600]
sift({ $mod: [3, 0] }, [100, 200, 300, 400, 500, 600]); 
```

### $all

values must match **everything** in array:

```javascript
//filtered: [ { tags: ['books','programming','travel' ]} ]
sift({ tags: {$all: ['books','programming'] }}, [
{ tags: ['books','programming','travel' ] }, 
{ tags: ['travel','cooking'] } ]); 
```

### $and

ability to use an array of expressions. All expressions must test true.

```javascript
//filtered: [ { name: 'Craig', state: 'MN' }]

sift({ $and: [ { name: 'Craig' }, { state: 'MN' } ] }, [ 
{ name: 'Craig', state: 'MN' }, 
{ name: 'Tim', state: 'MN' }, 
{ name: 'Joe', state: 'CA' } ]); 
```

### $or

OR array of expressions.

```javascript
//filtered: [ { name: 'Craig', state: 'MN' }, { name: 'Tim', state: 'MN' }]
sift({ $or: [ { name: 'Craig' }, { state: 'MN' } ] }, [ 
{ name: 'Craig', state: 'MN' }, 
{ name: 'Tim', state: 'MN' }, 
{ name: 'Joe', state: 'CA' } ]); 
```

### $nor

opposite of or:

```javascript
//filtered: [ { name: 'Tim', state: 'MN' }, { name: 'Joe', state: 'CA' }]
sift({ $nor: [ { name: 'Craig' }, { state: 'MN' } ] }, [ 
{ name: 'Craig', state: 'MN' }, 
{ name: 'Tim', state: 'MN' }, 
{ name: 'Joe', state: 'CA' } ]); 
```


### $size

Matches an array - must match given size:

```javascript
//filtered: ['food','cooking']
sift({ tags: { $size: 2 } }, [ { tags: ['food','cooking'] }, { tags: ['traveling'] }]); 
```

### $type

Matches a values based on the type

```javascript
sift({ $type: Date }, [new Date(), 4342, 'hello world']); //returns single date
sift({ $type: String }, [new Date(), 4342, 'hello world']); //returns ['hello world']
```

### $regex

Matches values based on the given regular expression

```javascript
sift({ $regex: /^f/i, $nin: ["frank"] }, ["frank", "fred", "sam", "frost"]); // ["fred", "frost"]
```

### $not

Not expression:

```javascript
sift({$not:{$in:['craig','tim']}}, ['craig','tim','jake']); //['jake']
sift({$not:{$size:5}}, ['craig','tim','jake']); //['tim','jake']
```

## sub object Searching


```javascript
var people = [{
	name: 'craig',
	address: {
		city: 'Minneapolis'
	}
},
{
	name: 'tim',
	address: {
		city: 'St. Paul'
	}
}];

var sifted = sift({ address: { city: 'Minneapolis' }}, people); // count = 1

//or
var sifted = sift({'address.city': 'minneapolis'}, people);//count = 1
```


## Custom Expressions

You can add your own expressions. For instance - say you want to do some bitmask filtering, you could add this example:

```javascript

sift.use({
	operations: {
		band: function(a, b) {
			return (a & b) ? 0 : -1; // 0 = exists, -1 = doesn't exist
		}
	}
})

// ops
var IS_ANIMAL = 2,
IS_PERSON     = IS_ANIMAL   << 1,
IS_DOG        = IS_PERSON   << 1,
EATS_CEREAL   = IS_DOG      << 1,
EATS_BONES    = EATS_CEREAL << 1;

sift({ $band: IS_PERSON }, [ S_PERSON|EATS_CEREAL, IS_DOG|EATS_BONES, IS_PERSON ]);
