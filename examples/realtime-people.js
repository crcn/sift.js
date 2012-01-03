
// deps
var srv   = require('express').createServer(),
_         = require('underscore'),
path      = require('path'),
sift      = require('../'),
fs        = require('fs'),
validator = require('validator'),
check     = validator.check;


var people  = [],

//path to the cashed data
configPath  = __dirname + '/tmp/people.json',

//the binding for /people/find
peopleBinding;


//tmp dir for the cached data
fs.mkdir(path.dirname(configPath), 0777);


//try loading in the cached people from disc
try {
	people = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch(e) { console.log(e); }



//when adding people, we want to throttle incase /people/add is spammed
var savePeople = _.throttle(function() {
	fs.writeFileSync(configPath, JSON.stringify(people, null, 2));
}, 500);

//adds people to the people collection
srv.get('/people/add', function(req, res) {

	//person already exists?
	if(sift({ name: req.query.name }, people).length) throw Error('That person already exists');
	
	//do some validation before adding a person. This stuff MUST be present
	check(req.query.name, 'name must be present').notEmpty();
	check(req.query.city, 'city must be present').notEmpty();
	check(req.query.state, 'state must be present').notEmpty();

	people.push(req.query);

	savePeople();

	//is there a binding present? notify that a user has been added
	if(peopleBinding && peopleBinding.test(req.query)) peopleBinding.onPerson(req.query);

	//notify that a user has been successfuly added
	res.send('Added person');
});

srv.get('/people/realtimeSearch', function(req, res) {
	res.header('Content-Type', 'application/json');

	

	peopleBinding = sift(req.query);
	var onPerson = peopleBinding.onPerson = function(person) {
		res.write('Found Person:\n');	
		res.write(JSON.stringify(person, null, 2) + '\n\n');	
	}

	peopleBinding(people).forEach(onPerson);
});

srv.listen(9090);

console.log('Listening on port 8080');
console.log('APIs: /people/add, /people/realtimeSearch\n');
console.log('First call /people/realtimeSearch?state=MN - keep it open')
console.log('Next call /people/add?name=Sarah&state=MN');