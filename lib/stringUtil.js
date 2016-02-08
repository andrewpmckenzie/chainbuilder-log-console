var format = require('util').format;
var SYMBOLS = require('./SYMBOLS');

module.exports = {
  stringify: function (o) {
    if (o instanceof Error) {
      return o.toString();
    } else if (typeof o === 'function') {
      return '[Function]';
    } else {
      return format('%j', o);
    }
  },

  stringOfSize: function (length) {
    if (length < 0) return '  ';
    return new Array(length + 1).join(' ');
  },

  depthIndent: function (depth) {
    return new Array(depth + 1).join(' ' + SYMBOLS.CHAIN_PROGRESS);
  },

  formatRuntime: function (time) {
    var message = '';
    if (time < 500) {
      message = time + 'ms';
    } else {
      time = (time / 1000).toFixed(2);
      message = time + 's';
    }
    return message;
  }
};
