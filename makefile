REPORTER=dot
ONLY="."
TESTS=./test
TIMEOUT=100

min: 
	./node_modules/.bin/uglifyjs ./sift.js -m -c > ./sift.min.js

test-node:
	./node_modules/.bin/mocha $(TESTS) -g $(ONLY) --reporter $(REPORTER) --bail

test-watch:
	./node_modules/.bin/mocha $(TESTS) -g $(ONLY) --reporter $(REPORTER) --bail --watch sift.js

lint: jshint jscs
	
jshint:
	./node_modules/.bin/jshint -c ./.jshint sift.js

jscs:
	./node_modules/.bin/jscs sift.js;

test-cov:
	PC_DEBUG=1 ./node_modules/.bin/istanbul cover \
	./node_modules/.bin/_mocha $(TESTS) -- --timeout $(TIMEOUT) --reporter $(REPORTER)

test-coveralls:
	PC_DEBUG=1 ./node_modules/.bin/istanbul cover \
	./node_modules/.bin/_mocha $(TESTS) -- --timeout $(TIMEOUT) --reporter $(REPORTER)  && \
	cat ./coverage/lcov.info | ./node_modules/.bin/coveralls --verbose