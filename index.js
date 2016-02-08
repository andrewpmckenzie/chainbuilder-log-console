var LogEvent = require('chainbuilder/lib/Logger').LogEvent;
var Logger = require('./lib/Logger');

module.exports = function (options) {
  var logger = new Logger(options);

  var handle = function (type, details) {
    switch (type) {
      case LogEvent.CHAIN_START:  return logger.chainStart(details);
      case LogEvent.CHAIN_END:    return logger.chainEnd(details);
      case LogEvent.CALL_START:   return logger.callStart(details);
      case LogEvent.CALL_SKIPPED: return logger.callSkipped(details);
      case LogEvent.CALL_END:     return logger.callEnd(details);
    }
  };

  handle.$logHandler = true;
  return { logConsole: handle };
};
