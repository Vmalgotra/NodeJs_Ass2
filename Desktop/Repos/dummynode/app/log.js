const EzeLog = require('eze-log');
const path = require('path');
const fs = require('fs');

function getLogLocation() {
  const newDateString = new Date().toISOString().slice(0, 10);
  const logLocation = path.resolve(__dirname, '../logs/performance-appdynamics-' + newDateString + '.log');
  const logDirectory = path.dirname(logLocation);
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
  }
  return logLocation;
}

EzeLog.setConfiguration({
  context: {
    Product: 'PerformanceBestPractice',
    AppDomain: 'Performance-Node-Sigteem',
    Service: 'NodeJs-Demo'
  },
  logFileName: getLogLocation()
});

const logger = new EzeLog();

logger.flushAndExit = function flushAndExit() {
  logger.logger.transports.file.on('flush', () => {
      process.exit(1);
  });
};

module.exports = logger;