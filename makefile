REPORTER=dot
ONLY="."
TESTS=./test

min: 
	./node_modules/.bin/uglifyjs ./sift.js -m -c > ./sift.min.js

test-node:
	./node_modules/.bin/mocha $(TESTS) -g $(ONLY) --reporter $(REPORTER)

test-watch:
	./node_modules/.bin/mocha $(TESTS) -g $(ONLY) --reporter $(REPORTER) --watch sift.js

lint: jshint jscs
	
jshint:
	./node_modules/.bin/jshint -c ./.jshint sift.js

jscs:
	./node_modules/.bin/jscs sift.js;
