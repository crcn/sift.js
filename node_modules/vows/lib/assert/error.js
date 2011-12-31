var stylize = require('../vows/console').stylize;
var inspect = require('../vows/console').inspect;

require('assert').AssertionError.prototype.toString = function () {
    var that = this,
        source;

    if (this.stack) {
        source = this.stack.match(/([a-zA-Z0-9._-]+\.(?:js|coffee))(:\d+):\d+/);
    }

    function parse(str) {
        var actual = inspect(that.actual, {showHidden: that.actual instanceof Error}),
            expected;

        if (that.expected instanceof Function) {
            expected = that.expected.name;
        }
        else {
            expected = inspect(that.expected, {showHidden: that.actual instanceof Error});
        }

        return str.replace(/{actual}/g,   actual).
                   replace(/{operator}/g, stylize(that.operator, 'bold')).
                   replace(/{expected}/g, expected);
    }

    if (this.message) {
        var msg = stylize(parse(this.message), 'yellow');
      	if (source) {
      		  msg += stylize(' // ' + source[1] + source[2], 'grey');
      	}
        return msg;
    } else {
        return stylize([
            this.expected,
            this.operator,
            this.actual
        ].join(' '), 'yellow');
    }
};

