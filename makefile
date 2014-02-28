browser:
	./node_modules/.bin/browserify ./sift.js -o ./sift.browser.js
	
clean:
	rm -rf test-web;


min: 
	closure-compiler --js ./sift.js --js_output_file ./sift.min.js


test-web:
	rm -rf test-web;
	cp -r test test-web;
	for F in `ls test-web | grep test`; do ./node_modules/.bin/sardines "test-web/$$F" -o "test-web/$$F" -p browser; done

