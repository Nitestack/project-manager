import { cancel, intro, isCancel, outro, log } from "@clack/prompts";
import color from "picocolors";
import { join } from "node:path";
import { homedir } from "node:os";
import { existsSync, lstatSync } from "node:fs";

export function getDirectoriesFromString(directoriesString: string | unknown) {
  if (!directoriesString) return [];
  if (typeof directoriesString !== "string") return [];
  const uniqueEntries = [...new Set(directoriesString.split(","))];
  return uniqueEntries.map((entry) => entry.trim()).filter(Boolean);
}
export function validateDirectoryString(
  basePath: string,
  isRelativeToHome = false,
) {
  return function (value: string) {
    const subDirs = getDirectoriesFromString(value);
    if (
      !subDirs.every((subDir) =>
        existsSync(join(isRelativeToHome ? homedir() : basePath, subDir)),
      )
    )
      return "Some directories do not exist";
    if (
      !subDirs.every((subDir) =>
        lstatSync(
          join(isRelativeToHome ? homedir() : basePath, subDir),
        ).isDirectory(),
      )
    )
      return "Some paths are not directories";
  };
}
export function validateBasePath(value: string) {
  if (!existsSync(value)) return "Path does not exist";
  if (
    !value.toLowerCase().startsWith(homedir().toLowerCase()) ||
    !value[homedir().length + 1]
  )
    return "Directory must be inside your home directory";
  if (!lstatSync(value).isDirectory()) return "Path is not a directory";
}

type ErrorLike = Error | string | unknown;
export class Logger {
  public static getErrorString(err: ErrorLike, withPrefix = false) {
    const errorMessage =
      typeof err === "string"
        ? err
        : err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
    return `${
      withPrefix ? `${color.bgRed(color.black(" ERROR "))} ` : ""
    }${color.red(errorMessage)}`;
  }
  public static getSuccessString(msg: string, withPrefix = false) {
    return `${
      withPrefix ? `${color.bgGreen(color.black(" SUCCESS "))} ` : ""
    }${color.green(msg)}`;
  }
  public static getInfoString(msg: string, withPrefix = false) {
    return `${
      withPrefix ? `${color.bgCyan(color.black(" INFO "))} ` : ""
    }${color.cyan(msg)}`;
  }
  public static error = (err: ErrorLike) => {
    log.error(Logger.getErrorString(err, true));
  };
  public static success = (msg: string) => {
    log.success(Logger.getSuccessString(msg, true));
  };
  public static info = (msg: string) => {
    log.info(Logger.getInfoString(msg, true));
  };
}

export function getIntro(msg?: string) {
  intro(Logger.getInfoString(msg ?? "Project Manager".toUpperCase()));
}
export function getOptionalString(msg: string) {
  return `${color.bgCyan(" OPTIONAL ")} ${msg}`;
}
export function getOutro(msg?: string) {
  outro(Logger.getSuccessString(msg ?? "Thanks for using Project Manager!"));
}
export function handleCancel(value: unknown, msg = "Process cancelled.") {
  if (isCancel(value)) {
    cancel(msg);
    process.exit(0);
  }
}
export function handleError(err: ErrorLike, stderr = false) {
  cancel(Logger.getErrorString(err, true));
  console.error(err);
  process.exit(stderr ? 1 : 0);
}
