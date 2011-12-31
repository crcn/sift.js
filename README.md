
### Simple Example

```javascript

var sift = require('sift');

var sifted = sift({$in: ['hello','world']}, ['hello','sifted','array!']); //['hello']

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


### Deep Searching Example:


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


### To Do

- $type
- regexp 
- function testing



