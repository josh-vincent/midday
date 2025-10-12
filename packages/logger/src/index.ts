const pino = require("pino");

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Log levels similar to Cal.com:
// fatal: 60 - Application cannot continue
// error: 50 - Error events
// warn: 40  - Warning events
// info: 30  - Informational messages (default)
// debug: 20 - Debug information
// trace: 10 - Very detailed debug information

export const logger = pino({
  level: process.env.LOG_LEVEL || process.env.NEXT_PUBLIC_LOG_LEVEL || "info",

  // Redact sensitive information
  redact: {
    paths: [
      "password",
      "passwordConfirmation",
      "credentials",
      "token",
      "apiKey",
      "api_key",
      "secret",
      "accessToken",
      "refreshToken",
      "authorization",
      "cookie",
      "*.password",
      "*.token",
      "*.apiKey",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },

  // Use pretty printing in development, structured JSON in production
  ...(IS_PRODUCTION
    ? {
        // Production: JSON format with UTC timestamps
        formatters: {
          level: (label: string) => {
            return { level: label };
          },
        },
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
      }
    : {
        // Development: Pretty format with colors
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
            messageFormat: "{msg}",
            hideObject: false,
            singleLine: false,
          },
        },
      }),
});

export default logger;
