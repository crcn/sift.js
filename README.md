
### Example

```javascript

var sift = require('sift');

//$or
var sifted = sift({$in: ['hello','world']}, ['hello','sifted','array!']); //['hello']

//this works too
var sifter = sift({$in: ['hello','world']});
sifter(['hello','sifted','array!']) //[hello]



```


## Supported operators:


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


## ToDo

- $type



