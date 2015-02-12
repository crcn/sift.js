var expect = require("expect.js");
var sift   = require("../sift");

describe(__filename + "#", function () {


  [

    // $eq
    [{$eq:5}, [5,"5", 6], [5]],
    ["5", [5,"5", 6], ["5"]],
    [false, [false,"false", true], [false]],
    [true, [1, true], [true]],
    [0, [0,"0"], [0]],
    [null, [void 0, null], [null]],
    [void 0, [void 0, null], [void 0]],
    [1, [2,3,4,5], []],
    [1, [[1]], [[1]]],
    [new Date(1), [new Date(), new Date(1), new Date(2), new Date(3)], [new Date(1)]],
    [/^a/, ["a","ab","abc","b","bc"], ["a","ab","abc"]],
    [function(b) { return b === 1; }, [1,2,3],[1]],

    // $neq
    [{$ne:5}, [5, "5", 6], ["5", 6]],
    [{$ne:"5"}, ["5", 6], [6]],
    [{$ne:false}, [false], []],
    [{$ne:void 0}, [false, 0, "0", void 0], [false, 0, "0"]],
    [{$ne:/^a/}, ["a","ab","abc","b","bc"], ["b","bc"]],

    // $lt
    [{$lt:5}, [3,4,5,6],[3,4]],
    [{$lt:"c"}, ["a","b","c"],["a","b"]],
    [{$lt:new Date(3)}, [new Date(1), new Date(2), new Date(3)],[new Date(1), new Date(2)]],

    // $lte
    [{$lte:5}, [3,4,5,6],[3,4,5]],

    // $gt
    [{$gt:5}, [3,4,5,6],[6]],

    // $gte
    [{$gte:5}, [3,4,5,6],[5, 6]],

    // $mod
    [{$mod:[2,1]}, [1,2,3,4,5,6],[1,3,5]],

    // $exists
    [{$exists:false}, [0,false,void 0, null],[void 0, void 0]],
    [{$exists:true}, [0,false,void 0, 1, {}],[0, false, 1, {}]],

    // $in
    // TODO - {$in:[Date]} doesn't work - make it work?
    [{$in:[0,false,1,"1"]},[0,1,2,3,4,false],[0,1,false]],
    [{$in:[1,"1","2"]},["1","2","3"],["1","2"]],

    // $nin
    [{$nin:[0,false,1,"1"]},[0,1,2,3,4,false],[2,3,4]],
    [{$nin:[1,"1","2"]},["1","2","3"],["3"]],

    // $not
    [{$not:false},[0,false],[0]],
    [{$not:0},[0, false, 1, 2, 3],[false, 1, 2, 3]],
    [{$not:{$in:[1,2,3]}},[1,2,3,4,5,6],[4,5,6]], // with expressions

    // $type
    [{$type:Date}, [0,new Date(1)],[new Date(1)]],
    [{$type:Number}, [0,false,1],[0,1]],
    [{$type:Boolean}, [0,false],[false]],
    [{$type:String}, ["1",1,false],["1"]],

    // $all
    [{$all:[1,2,3]},[[1,2,3,4],[1,2,4]],[[1,2,3,4]]],
    [{$all:[0,false]},[[0,1,2],[0,false],["0","false"],void 0],[[0,false]]],
    [{$all:["1"]},[[1]],[]],

    // $size
    [{$size:3},["123",[1,2,3],"1"],["123",[1,2,3]]],
    
    // $or
    [{$or:[1,2,3]},[1,2,3,4],[1,2,3]],
    [{$or:[{$ne:1},2]},[1,2,3,4,5,6],[2,3,4,5,6]],

    // $nor
    [{$nor:[1,2,3]},[1,2,3,4],[4]],
    [{$nor:[{$ne:1},2]},[1,2,3,4,5,6],[1]],

    // $and
    [{$and:[{$gt:1},{$lt:4}]},[1,2,3,4],[2,3]],
    
    // $regex
    [{$regex:"^a"},["a","ab","abc","bc","bcd"],["a","ab","abc"]]

  ].forEach(function (operation) {

    var filter = operation[0],
    array      = operation[1],
    matchArray = operation[2];

    it(JSON.stringify(filter), function () {
      var sifter = sift(filter);
      expect(JSON.stringify(sifter(array))).to.equal(JSON.stringify(matchArray));
    });
  });
});