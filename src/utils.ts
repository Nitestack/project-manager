import {
  type TextOptions,
  cancel,
  intro,
  isCancel,
  outro,
  log,
} from "@clack/prompts";
import { TextPrompt, type State } from "@clack/core";
import color from "picocolors";
import isUnicodeSupported from "is-unicode-supported";
import { join } from "node:path";
import { homedir } from "node:os";
import { existsSync, lstatSync } from "node:fs";
// @ts-expect-error Type definitions don't work
import { Fzf, type FzfResultItem, Tiebreaker, extendedMatch } from "fzf";

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
  process.exit(stderr ? 1 : 0);
}

const unicode = isUnicodeSupported();
const s = (c: string, fallback: string) => (unicode ? c : fallback);

const S_STEP_ACTIVE = s("◆", "*");
const S_STEP_CANCEL = s("■", "x");
const S_STEP_ERROR = s("▲", "x");
const S_STEP_SUBMIT = s("◇", "o");

const S_CONNECT_LEFT = s("├", "+");

const S_BAR = s("│", "|");
const S_BAR_END = s("└", "—");

const symbol = (state: State) => {
  switch (state) {
    case "initial":
    case "active":
      return color.cyan(S_STEP_ACTIVE);
    case "cancel":
      return color.red(S_STEP_CANCEL);
    case "error":
      return color.yellow(S_STEP_ERROR);
    case "submit":
      return color.green(S_STEP_SUBMIT);
  }
};

export function multilinePrompt(message: string) {
  const parts = [];
  const [firstLine, ...lines] = message.split("\n");
  parts.push(
    `${firstLine}`,
    ...lines.map((ln) => `${color.cyan(S_BAR)}  ${ln}`),
  );
  return parts.join("\n");
}

// @ts-expect-error Type definitions don't work
const byTrimmedLengthAsc: Tiebreaker = (a, b, selector) => {
  return selector(a.item).trim().length - selector(b.item).trim().length;
};

function withBold(text: string, indices: Set<number>) {
  const chars = text.split("");
  const nodes = chars.map((char, i) => {
    if (indices.has(i)) {
      return color.green(char);
    } else {
      return char;
    }
  });
  return nodes.join("");
}

function createRender({
  title,
  color,
  end,
}: {
  title: string;
  color: string;
  end: string;
}) {
  return `${title}${color}  ${end}`;
}

export function fuzzySearch(
  opts: Omit<TextOptions, "validate"> & {
    items: string[];
  },
) {
  const fzf = new Fzf(opts.items, {
    match: extendedMatch,
    tiebreakers: [byTrimmedLengthAsc],
  });
  return new TextPrompt({
    validate(value) {
      const result = fzf.find(value);
      if (!result.length) return "No results found.";
    },
    placeholder: opts.placeholder,
    defaultValue: opts.defaultValue,
    initialValue: opts.initialValue,
    render() {
      const result: FzfResultItem<string>[] = fzf.find(this.value ?? "");

      const title = `${color.gray(S_BAR)}\n${symbol(this.state)}  ${
        opts.message
      }\n`;
      const placeholder = opts.placeholder
        ? color.inverse(opts.placeholder[0]) +
          color.dim(opts.placeholder.slice(1))
        : color.inverse(color.hidden("_"));
      const value = !this.value ? placeholder : this.valueWithCursor;

      switch (this.state) {
        case "error":
          return createRender({
            title: title.trim(),
            color: `\n${color.yellow(S_BAR)}`,
            end: `${value}\n${color.yellow(S_BAR_END)}  ${color.yellow(
              this.error,
            )}\n`,
          });
        case "submit":
          this.value = result[0].item;
          return createRender({
            title: title,
            color: color.gray(S_BAR),
            end: color.dim(result[0].item || opts.placeholder),
          });
        case "cancel":
          return createRender({
            title: title,
            color: color.gray(S_BAR),
            end: `${color.strikethrough(color.dim(this.value ?? ""))}${
              this.value?.trim() ? "\n" + color.gray(S_BAR) : ""
            }`,
          });
        default:
          return createRender({
            title: title,
            color: color.cyan(S_BAR),
            end: `${value}${
              result.length
                ? "\n" +
                  result
                    .map(
                      (r) =>
                        `${color.cyan(S_CONNECT_LEFT)}  ${color.dim(
                          withBold(r.item.normalize(), r.positions),
                        )}`,
                    )
                    .join("\n")
                : ""
            }\n${color.cyan(S_BAR_END)}\n`,
          });
      }
    },
  }).prompt() as Promise<string>;
}
