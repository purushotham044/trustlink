// ============================================================
// TrustLink Enterprise QA — Resilient Logging Engine
// ============================================================

const path = require('path');
const fs = require('fs');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

let winstonLogger = null;
try {
  const winston = require('winston');
  winstonLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    defaultMeta: { service: 'trustlink-qa' },
    transports: [
      new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
      new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp }) => `[${timestamp}] ${level}: ${message}`)
        ),
      }),
    ],
  });
} catch (e) {
  // Built-in fallback logger
  winstonLogger = {
    info: (msg) => {
      const line = `[${new Date().toISOString()}] INFO: ${msg}`;
      console.log(line);
      fs.appendFileSync(path.join(logDir, 'combined.log'), line + '\n');
    },
    warn: (msg) => {
      const line = `[${new Date().toISOString()}] WARN: ${msg}`;
      console.warn(line);
      fs.appendFileSync(path.join(logDir, 'combined.log'), line + '\n');
    },
    error: (msg) => {
      const line = `[${new Date().toISOString()}] ERROR: ${msg}`;
      console.error(line);
      fs.appendFileSync(path.join(logDir, 'error.log'), line + '\n');
    },
  };
}

module.exports = winstonLogger;
