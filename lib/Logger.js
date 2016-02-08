var colors = require('colors/safe');
colors.enabled = true;
var format = require('util').format;
var stringUtil = require('./stringUtil');
var SYMBOLS = require('./SYMBOLS');

var Logger = function (options) {
  options = options || {};
  this._out   = options.log   || console.log;
  this._width = options.width || 120;
  this._detailed = (typeof options.detailed === 'boolean') ? options.detailed : true;
  this._colors = !!options.colors;
};

Logger.prototype = {
  _rainbow: function (text) {
    var colorList = ['grey', 'cyan', 'magenta', 'blue'];
    var textChunks = [];
    var level = 0;
    var color, char;
    for (var i = 0; i < text.length; i++) {
      char = text[i];
      if (SYMBOLS.COLOR_STEPS.indexOf(char) !== -1) level++;
      color = colorList[level % colorList.length];
      textChunks.push(colors[color](char));
    }
    return textChunks.join('');
  },

  _generateLines: function (depth, hangingIndentSize, symbol, message, rightOnFirstLine, incrementDepthForSubsequentLines, color) {
    color = color || 'reset';
    var lines = message.split(/\r?\n/);
    var depthIndent = stringUtil.depthIndent(depth) + symbol;
    var hangingDepthIndent = stringUtil.depthIndent(depth + (incrementDepthForSubsequentLines ? 1 : 0));
    var hangingIndent = stringUtil.stringOfSize(hangingIndentSize);

    return lines.map(function (line, i) {
      var rightText = (rightOnFirstLine && i === 0) ? rightOnFirstLine : '';
      var indent = i === 0 ? depthIndent : hangingDepthIndent + hangingIndent;
      var combinedTextSize = indent.length + line.length + rightText.length;
      var padding = stringUtil.stringOfSize(this._width - combinedTextSize);

      if (this._colors) {
        indent = this._rainbow(indent);
        line = colors[color] ? colors[color](line) : line;
        rightText = colors.dim(rightText);
      }

      return indent + line + padding + rightText;
    }.bind(this));
  },

  _print: function (depth, symbol, leftText, rightText, incrementDepthForSubsequentLines, color) {
    leftText = leftText || '';
    rightText = rightText || '';
    var symbolWithPadding = ' ' + symbol + ' ';
    var message = leftText;

    this._generateLines(depth, symbol.length, symbolWithPadding, message, rightText, incrementDepthForSubsequentLines, color).forEach(function (line) {
      this._out(line);
    }.bind(this));
  },

  /**
   * @param {Logger.ChainStartDetails} details
   */
  chainStart: function (details) {
    var hasInitialValue = typeof details.initialValue !== 'undefined';
    var symbol = hasInitialValue ? SYMBOLS.CHAIN_START_WITH_INITIAL_VALUE : SYMBOLS.CHAIN_START;
    var depth = details.depth;
    var maxStringSize = this._width - (symbol.length + stringUtil.depthIndentSize(depth));
    var printableInitialValue = hasInitialValue ? SYMBOLS.TRUNCATED : '';
    if (this._detailed) {
      printableInitialValue = hasInitialValue ? stringUtil.stringify(details.initialValue, maxStringSize) : '';
    }
    this._print(depth, symbol, printableInitialValue, null, true, null);
  },

  /**
   * @param {Logger.ChainEndDetails} details
   */
  chainEnd: function (details) {
    var hasResult = typeof details.result !== 'undefined';
    var hasError = !!details.error;
    var symbol = SYMBOLS.CHAIN_END;
    var depth = details.depth;
    if (hasError) symbol = SYMBOLS.CHAIN_END_WITH_ERROR;
    if (hasResult) symbol = SYMBOLS.CHAIN_END_WITH_RETURN_VALUE;

    var maxStringSize = this._width - (symbol.length + stringUtil.depthIndentSize(depth));
    var message = '';
    if (hasError || hasResult) {
      if (this._detailed) {
        message = stringUtil.stringify(hasError ? details.error : hasResult ? details.result : '', maxStringSize)
      } else {
        message = SYMBOLS.TRUNCATED;
      }
    }
    var time = stringUtil.formatRuntime(details.runTime);

    this._print(depth, symbol, message, time, false, hasError ? 'yellow' : null);
  },

  /**
   * @param {Logger.CallStartDetails} details
   */
  callStart: function (details) {
    var signature = SYMBOLS.TRUNCATED;
    var depth = details.depth;
    var maxStringSize = this._width - (stringUtil.depthIndentSize(depth) + SYMBOLS.CALL_ENTER.length + details.methodName.length + 5);
    if (this._detailed) {
      var args = (details.evaluatedArgs || []).map(function (arg) {
        return ( typeof (arg && arg.toLogString) === 'function' ) ? arg.toLogString() : stringUtil.stringify(arg, maxStringSize);
      });
      signature = args.join(', ');
    }

    var methodName = format('%s(%s)', details.methodName, signature);
    this._print(depth, SYMBOLS.CALL_ENTER, methodName, null, true, null);
  },

  /**
   * @param {Logger.CallSkippedDetails} details
   */
  callSkipped: function (details) {
    var signature = SYMBOLS.TRUNCATED;
    var depth = details.depth;
    var maxStringSize = this._width - (stringUtil.depthIndentSize(depth) + SYMBOLS.CALL_SKIP.length + 5);
    if (this._detailed) {
      var args = (details.args || []).map(function (arg) {
        return ( typeof (arg && arg.toLogString) === 'function' ) ? arg.toLogString() : stringUtil.stringify(arg, maxStringSize);
      });
      signature = args.join(', ');
    }

    var methodName = format('%s(%s)', details.methodName, signature);
    this._print(depth, SYMBOLS.CALL_SKIP, methodName, null, true, 'gray');
  },

  /**
   * @param {Logger.CallEndDetails} details
   */
  callEnd: function (details) {
    var hasResult = typeof details.result !== 'undefined';
    var hasError = !!details.error;
    var symbol = SYMBOLS.CALL_RETURN;
    var message = '';
    var depth = details.depth;
    var maxStringSize = this._width - (stringUtil.depthIndentSize(depth) + 5);
    if (hasError) {
      symbol = SYMBOLS.CALL_ERROR;
      message = stringUtil.stringify(details.error, maxStringSize);
    }
    if (hasResult && this._detailed) {
      message = stringUtil.stringify(details.result, maxStringSize);
    }
    var time = stringUtil.formatRuntime(details.runTime);

    this._print(depth, symbol, message, time, true, hasError ? 'yellow' : null);
  }
};

module.exports = Logger;
