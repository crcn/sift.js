![Alt travis status](https://secure.travis-ci.org/crcn/sift.js.png)

## Simple Example

```javascript

var sift = require('sift');

var sifted = sift({ $in: ['hello','world'] }, ['hello','sifted','array!']); //['hello']

```

## API

### .sift(filter[, array])

- `filter` - the filter to use against the target array
- `array` - sifts against target array. Without this, a function is returned

With an array:

```javascript
sift({$exists:true}, ['craig',null]); //['craig']
```

Without an array:

```javascript
var siftExists = sift({$exists:true});

siftExists(['craig',null]); //['craig']
```


## Supported Operators:

See MonboDB's [advanced queries](http://www.mongodb.org/display/DOCS/Advanced+Queries) for more info.

### $in

array value must be *$in* the given query:

Intersecting two arrays:
 
```javascript
sift({ $in: ['Costa Rica','Brazil'] }, ['Brazil','Haiti','Peru','Chile']); // ['Brazil']
``` 

Here's another example. This acts more like the $or operator:

```javascript
sift({ location: : { $in: ['Costa Rica','Brazil'] } }, { name: 'Craig', location: 'Brazil' });
```

### $nin

Oppositve of $in:

```javascript
sift({ $in: ['Costa Rica','Brazil'] }, ['Brazil','Haiti','Peru','Chile']); // ['Haiti','Peru','Chile']
``` 

### $exists

Checks if whether a value exists:

```javascript
sift({ $exists: true }, ['Craig',null,'Tim']); // ['Craig','Tim']
``` 

You can also filter out values that don't exist

```javascript
sift({ city: { $exists: false } }, [ { name: 'Craig', city: 'Minneapolis' }, { name: 'Tim' }]); //[{ name: 'Craig', city: 'Minneapolis' }]
```

### $gte

Checks if a number is >= value:

```javascript
sift({ $gte: 2 }, [0, 1, 2, 3]); //[2, 3]
```

### $gt

Checks if a number is > value:

```javascript
sift({ $gt: 2 }, [0, 1, 2, 3]); //[3]
```

### $lte

Checks if a number is <= value.

### $lt

Checks if number is < value.

### $eq

Checks if query != value. Note that **$eq can be omitted**.

```javascript
sift({ state: {$eq: 'MN' }}, [{ state: 'MN' }, { state: 'CA' }, { state: 'WI' }); //[{ state: 'MN' }]
```


### $ne

Checks if query == value.

```javascript
sift({ state: {$ne: 'MN' }}, [{ state: 'MN' }, { state: 'CA' }, { state: 'WI' }); //[{ state: 'CA' }, { state: 'WI'}]
```

### $mod

Modulus:

```javascript
sift({ $mod: [3, 0] }, [100, 200, 300, 400, 500, 600]); //[300,600]
```

### $all

values must match **everything** in array:

```javascript
sift({ tags: {$all: ['books','programming'] }}, { tags: ['books','programming','travel' ] }, { tags: ['travel','cooking'] }); //[ { tags: ['books','programming','travel' ]} ]
```

### $and

ability to use an array of expressions. All expressions must test true.

sift({ $and: [ { name: 'Craig' }, { state: 'MN' } ] }, [ { name: 'Craig', state: 'MN' }, { name: 'Tim', state: 'MN' }, { name: 'Joe', state: 'CA' } ]); //[ { name: 'Craig', state: 'MN' }]

### $or

OR array of expressions.


sift({ $or: [ { name: 'Craig' }, { state: 'MN' } ] }, [ { name: 'Craig', state: 'MN' }, { name: 'Tim', state: 'MN' }, { name: 'Joe', state: 'CA' } ]); //[ { name: 'Craig', state: 'MN' }, { name: 'Tim', state: 'MN' }]

### $size

Matches an array - must match given size:

```javascript
sift({ tags: { $size: 2 } }, [ { tags: ['food','cooking'] }, { tags: ['traveling'] }]); //['food','cooking']
```


## Deep Searching Example:


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

var sifted = sift({ address: { state: 'Minneapolis' }}, people); // count = 1

```






## To Do

- $type
- regexp 
- function testing



