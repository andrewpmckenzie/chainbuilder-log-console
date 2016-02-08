var format = require('util').format;
var stringUtil = require('./stringUtil');
var SYMBOLS = require('./SYMBOLS');

var Logger = function (options) {
  options = options || {};
  this._out   = options.log   || console.out;
  this._width = options.width || 120;
  this._detailed = typeof options.detailed === 'boolean' ? options.detailed : true;
};

Logger.prototype = {
  _print: function (depth, symbol, leftText, rightText) {
    leftText = leftText || '';
    rightText = rightText || '';
    var symbolWithPadding = ' ' + symbol + ' ';
    var indent = stringUtil.depthIndent(depth);
    var combinedTextSize = indent.length + symbolWithPadding.length + leftText.length + rightText.length;
    var padding = stringUtil.stringOfSize(this._width - combinedTextSize);

    this._out(indent + symbolWithPadding + leftText + padding + rightText);
  },

  /**
   * @param {Logger.ChainStartDetails} details
   */
  chainStart: function (details) {
    var hasInitialValue = typeof details.initialValue !== 'undefined';
    var symbol = hasInitialValue ? SYMBOLS.CHAIN_START_WITH_INITIAL_VALUE : SYMBOLS.CHAIN_START;
    var printableInitialValue = hasInitialValue ? stringUtil.stringify(details.initialValue) : '';
    this._print(details.depth, symbol, printableInitialValue);
  },

  /**
   * @param {Logger.ChainEndDetails} details
   */
  chainEnd: function (details) {
    var hasResult = typeof details.result !== 'undefined';
    var hasError = !!details.error;
    var symbol = SYMBOLS.CHAIN_END;
    var message = '';
    if (hasError) {
      symbol = SYMBOLS.CHAIN_END_WITH_ERROR;
      message = stringUtil.stringify(details.error);
    }
    if (hasResult) {
      symbol = SYMBOLS.CHAIN_END_WITH_RETURN_VALUE;
      message = stringUtil.stringify(details.result);
    }
    var time = stringUtil.formatRuntime(details.runTime);

    this._print(details.depth, symbol, message, time);
  },

  /**
   * @param {Logger.CallStartDetails} details
   */
  callStart: function (details) {
    var signature = SYMBOLS.TRUNCATED;
    if (this._detailed) {
      var args = (details.evaluatedArgs || []).map(function (arg) {
        return ( typeof (arg && arg.toLogString) === 'function' ) ? arg.toLogString() : stringUtil.stringify(arg);
      });
      signature = args.join(', ');
    }

    var methodName = format('%s(%s)', details.methodName, signature);
    this._print(details.depth, SYMBOLS.CALL_ENTER, methodName);
  },

  /**
   * @param {Logger.CallSkippedDetails} details
   */
  callSkipped: function (details) {
    var signature = SYMBOLS.TRUNCATED;
    if (this._detailed) {
      var args = (details.args || []).map(function (arg) {
        return ( typeof (arg && arg.toLogString) === 'function' ) ? arg.toLogString() : stringUtil.stringify(arg);
      });
      signature = args.join(', ');
    }

    var methodName = format('%s(%s)', details.methodName, signature);
    this._print(details.depth, SYMBOLS.CALL_SKIP, methodName);
  },

  /**
   * @param {Logger.CallEndDetails} details
   */
  callEnd: function (details) {
    var hasResult = typeof details.result !== 'undefined';
    var hasError = !!details.error;
    var symbol = SYMBOLS.CALL_RETURN;
    var message = '';
    if (hasError) {
      symbol = SYMBOLS.CALL_ERROR;
      message = stringUtil.stringify(details.error);
    }
    if (hasResult && this._detailed) {
      message = stringUtil.stringify(details.result);
    }
    var time = stringUtil.formatRuntime(details.runTime);

    this._print(details.depth, symbol, message, time);
  }
};

module.exports = Logger;
