// Imports //
import chalk, { ChalkInstance } from "chalk";

// Enums //
const enum LogLevel {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  FATAL = "FATAL",
  SUCCESS = "SUCCESS",
}

// Constants //
const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

// Local Functions //
function formatMessage(
  level: LogLevel,
  color: ChalkInstance,
  message: string
): string {
  const timestamp = new Date().toLocaleTimeString("en-US", TIME_OPTIONS);
  return `${chalk.gray(`[${timestamp}]`)} ${color(`[${level}]`)}: ${message}`;
}

// Exports //
export function warning(message: string): void {
  console.log(formatMessage(LogLevel.WARNING, chalk.yellow.bold, message));
}

export function error(message: string): void {
  console.log(formatMessage(LogLevel.ERROR, chalk.red.bold, message));
}

export function fatal(message: string): never {
  console.log(formatMessage(LogLevel.FATAL, chalk.red.bold, message));
  process.exit(1);
}

export function info(message: string): void {
  console.log(formatMessage(LogLevel.INFO, chalk.blue.bold, message));
}

export function success(message: string): void {
  console.log(formatMessage(LogLevel.SUCCESS, chalk.green.bold, message));
}
