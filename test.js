const sift = require('./sift');
const target = [1, 2, 3, 4];

console.log(sift({ $gt: 2 })(target));
