import { type Readable, type Writable } from "node:stream";
import isUnicodeSupported from "is-unicode-supported";
import color from "picocolors";
import { type State, Prompt } from "@clack/core";

const unicode = isUnicodeSupported();
const s = (c: string, fallback: string) => (unicode ? c : fallback);

export const S_RADIO_ACTIVE = s("●", ">");
export const S_RADIO_INACTIVE = s("○", " ");

const S_STEP_ACTIVE = s("◆", "*");
const S_STEP_CANCEL = s("■", "x");
const S_STEP_ERROR = s("▲", "x");
const S_STEP_SUBMIT = s("◇", "o");

export const S_BAR = s("│", "|");
export const S_BAR_END = s("└", "—");

export const symbol = (state: State) => {
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

export interface PromptOptions<Self extends Prompt> {
  render(this: Omit<Self, "prompt">): string | void;
  placeholder?: string;
  initialValue?: any;
  validate?: ((value: any) => string | void) | undefined;
  input?: Readable;
  output?: Writable;
  debug?: boolean;
}

export type Primitive = Readonly<string | boolean | number>;

export type Option<Value> = Value extends Primitive
  ? { value: Value; label?: string; hint?: string }
  : { value: Value; label: string; hint?: string };

interface LimitOptionsParams<TOption> {
  options: TOption[];
  maxItems: number | undefined;
  cursor: number;
  style: (option: TOption, active: boolean) => string;
}

export const limitOptions = <TOption>(
  params: LimitOptionsParams<TOption>,
): string[] => {
  const { cursor, options, style } = params;

  // We clamp to minimum 5 because anything less doesn't make sense UX wise
  const maxItems =
    params.maxItems === undefined ? Infinity : Math.max(params.maxItems, 5);
  let slidingWindowLocation = 0;

  if (cursor >= slidingWindowLocation + maxItems - 3) {
    slidingWindowLocation = Math.max(
      Math.min(cursor - maxItems + 3, options.length - maxItems),
      0,
    );
  } else if (cursor < slidingWindowLocation + 2) {
    slidingWindowLocation = Math.max(cursor - 2, 0);
  }

  const shouldRenderTopEllipsis =
    maxItems < options.length && slidingWindowLocation > 0;
  const shouldRenderBottomEllipsis =
    maxItems < options.length &&
    slidingWindowLocation + maxItems < options.length;

  return options
    .slice(slidingWindowLocation, slidingWindowLocation + maxItems)
    .map((option, i, arr) => {
      const isTopLimit = i === 0 && shouldRenderTopEllipsis;
      const isBottomLimit = i === arr.length - 1 && shouldRenderBottomEllipsis;
      return isTopLimit || isBottomLimit
        ? color.dim("...")
        : style(option, i + slidingWindowLocation === cursor);
    });
};
