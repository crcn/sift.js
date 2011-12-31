
## Simple Example

```javascript

var sift = require('sift');

var sifted = sift({$in: ['hello','world']}, ['hello','sifted','array!']); //['hello']

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


### $in

### $nin

### $exists

### $gte

### $gt

### $lte

### $lt

### $ne

### $eq

### $exists

### $mod

### $all

### $and

### $or

### $size


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



