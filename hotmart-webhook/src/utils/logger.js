const winston = require("winston");

const brTimestamp = winston.format((info) => {
  info.timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour12: false }).replace(",", "");
  return info;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "hotmart-webhook" },
  format: winston.format.combine(
    brTimestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error", maxsize: 5242880, maxFiles: 3 }),
    new winston.transports.File({ filename: "logs/combined.log", maxsize: 10485760, maxFiles: 5 }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
          const msg = typeof info.message === "object" ? JSON.stringify(info.message) : info.message;
          return info.timestamp + " [" + info.level + "]: " + msg;
        })
      ),
    }),
  ],
});

module.exports = logger;
