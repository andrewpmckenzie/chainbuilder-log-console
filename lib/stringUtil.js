var format = require('util').format;
var SYMBOLS = require('./SYMBOLS');
var jsonPrettyPrint = require('json-stringify-pretty-compact');

module.exports = {
  stringify: function (o, maxLength) {
    if (o instanceof Error) {
      return o.toString() + '\n';
    } else if (typeof o === 'function') {
      return '[Function]';
    } else {
      try {
        return jsonPrettyPrint(o, { indent: 2, maxLength: maxLength });
      } catch (e) {
        return format('%j', o);
      }
    }
  },

  stringOfSize: function (length) {
    if (length < 0) return '  ';
    return new Array(length + 1).join(' ');
  },

  depthIndent: function (depth) {
    return new Array(depth + 1).join(' ' + SYMBOLS.CHAIN_PROGRESS);
  },

  depthIndentSize: function (depth) {
    return depth * (1 + SYMBOLS.CHAIN_PROGRESS.length);
  },

  formatRuntime: function (time) {
    if (typeof time !== 'number') return '';

    var message = '';
    if (time < 500) {
      message = time + 'ms';
    } else {
      time = (time / 1000).toFixed(2);
      message = time + 's';
    }
    return message;
  },

  extractFile: function (stackEntry) {
    if (!stackEntry) return '';
    var match = stackEntry.match(/\/([^/]+)\)$/);
    return match ? match[1] : '';
  }
};
