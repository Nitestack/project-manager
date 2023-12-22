// @ts-expect-error Type definitions don't work
import { Fzf, type FzfResultItem, Tiebreaker, extendedMatch } from "fzf";
import {
  type Option,
  type PromptOptions,
  limitOptions,
  symbol,
  S_RADIO_ACTIVE,
  S_RADIO_INACTIVE,
  S_BAR,
  S_BAR_END,
} from "@src/clack/index.js";
import { Prompt } from "@clack/core";
import color from "picocolors";

interface FuzzyFinderPromptOptions<T extends { value: any }>
  extends Omit<PromptOptions<FuzzySelectPrompt<T>>, "validate"> {
  options: T[];
  initialValue?: T["value"];
  notFoundMessage?: string;
}

class FuzzySelectPrompt<T extends { value: any }> extends Prompt {
  private fuzzyFinder: Fzf<T[]>;

  // Text props
  valueWithCursor = "";
  private get cursor() {
    return this._cursor;
  }

  // Selection props
  selectCursor = 0;
  private selectedValue: T["value"] = "";
  searchResults: SearchResult<T>[];
  private changeSelectionValue() {
    this.selectedValue = this.searchResults[this.selectCursor]!.value;
  }
  private getSearchResults(query?: string) {
    return this.fuzzyFinder
      .find(query ?? "")
      .map(({ item, positions }: { item: T; positions: Set<number> }) => ({
        ...item,
        positions,
      }));
  }

  constructor(opts: FuzzyFinderPromptOptions<T>) {
    const fuzzyFinder = new Fzf(opts.options, {
      // @ts-expect-error Type definitions don't work
      selector: (item) => item.label,
      match: extendedMatch,
      tiebreakers: [byTrimmedLengthAsc],
    });

    const { notFoundMessage, ...restOpts } = opts;

    super({
      ...restOpts,
      validate: (value) => {
        const result = fuzzyFinder.find(value ?? "");
        if (!result.length) return notFoundMessage ?? "No results found.";
      },
    });

    this.fuzzyFinder = fuzzyFinder;

    // Setting up initial search results
    this.searchResults = this.getSearchResults(opts.initialValue);
    this.changeSelectionValue();

    // On selection done
    this.on("finalize", () => {
      if (this.state == "submit") {
        this.value = this.selectedValue;
        this.valueWithCursor = this.selectedValue;
      } else {
        // Don't set value to a selection here because operation was cancelled
        this.valueWithCursor = this.value;
      }
    });
    // On key events (selection)
    this.on("cursor", (key) => {
      switch (key) {
        // Update cursor position of selection
        case "up":
          this.selectCursor =
            this.selectCursor === 0
              ? this.searchResults.length - 1
              : this.selectCursor - 1;
          this.changeSelectionValue();
          break;
        case "down":
          this.selectCursor =
            this.selectCursor === this.searchResults.length - 1
              ? 0
              : this.selectCursor + 1;
          this.changeSelectionValue();
          break;
        // Update cursor position of text input
        case "right":
        case "left":
          this._cursor = this.cursor + (key == "right" ? 1 : -1);
          break;
      }
    });
    // Text value change
    this.on("value", () => {
      // Apply text cursor position styling
      if (this.cursor >= this.value.length) {
        this.valueWithCursor = `${this.value}${color.inverse(
          color.hidden("_"),
        )}`;
      } else {
        const s1 = this.value.slice(0, this.cursor);
        const s2 = this.value.slice(this.cursor);
        this.valueWithCursor = `${s1}${color.inverse(s2[0])}${s2.slice(1)}`;
      }

      // Change search results based on the new query
      this.searchResults = this.getSearchResults(this.value);
      if (this.searchResults.length) {
        // Ensure the cursor is within the search results
        if (this.selectCursor >= this.searchResults.length) {
          this.selectCursor = this.searchResults.length - 1;
        }
        this.changeSelectionValue();
      }
    });
  }
}

type SearchResult<T> = T & {
  positions: Set<number>;
  // start: number;
  // end: number;
  // score: number;
};

export interface FuzzyFinderOptions<Value> {
  message: string;
  options: Option<Value>[];
  initialValue?: Value;
  maxItems?: number;
  placeholder?: string;
  notFoundMessage?: string;
}

// @ts-expect-error Type definitions don't work
const byTrimmedLengthAsc: Tiebreaker = (a, b, selector) => {
  return selector(a.item).trim().length - selector(b.item).trim().length;
};

function withBold(text: string, indices: Set<number>) {
  const chars = text.split("");
  const nodes = chars.map((char, i) => {
    if (indices.has(i)) {
      return color.green(color.bold(char));
    } else {
      return char;
    }
  });
  return nodes.join("");
}

export function fuzzySearch<Value>(opts: FuzzyFinderOptions<Value>) {
  const opt = (
    option: SearchResult<Option<Value>>,
    state: "inactive" | "active" | "selected" | "cancelled",
  ) => {
    const label = withBold(
      option.label ?? String(option.value),
      option.positions,
    );
    switch (state) {
      case "selected":
        return `${color.dim(label)}`;
      case "active":
        return color.bgBlack(
          `${color.green(S_RADIO_ACTIVE)} ${label} ${
            option.hint ? color.dim(`(${option.hint})`) : ""
          }`,
        );
      case "cancelled":
        return `${color.strikethrough(color.dim(label))}`;
      default:
        return `${color.dim(S_RADIO_INACTIVE)} ${color.dim(label)}`;
    }
  };
  return new FuzzySelectPrompt({
    placeholder: opts.placeholder,
    initialValue: opts.initialValue,
    notFoundMessage: opts.notFoundMessage,
    options: opts.options,
    render() {
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
          return `${title.trim()}\n${color.yellow(
            S_BAR,
          )}  ${value}\n${color.yellow(S_BAR_END)}  ${color.yellow(
            this.error,
          )}\n`;
        case "submit":
          return `${title}${color.gray(S_BAR)}  ${opt(
            this.searchResults[this.selectCursor]!,
            "selected",
          )}`;
        case "cancel":
          return `${title}${color.gray(S_BAR)}  ${color.strikethrough(
            color.dim(this.value ?? ""),
          )}${this.value?.trim() ? "\n" + color.gray(S_BAR) : ""}`;
        default:
          return `${title}${color.cyan(S_BAR)}  ${value}${
            this.searchResults.length
              ? `\n${color.cyan(S_BAR)}  ${limitOptions({
                  cursor: this.selectCursor,
                  options: this.searchResults,
                  maxItems: opts.maxItems,
                  style: (item, active) =>
                    opt(item, active ? "active" : "inactive"),
                }).join(`\n${color.cyan(S_BAR)}  `)}`
              : ""
          }\n${color.cyan(S_BAR_END)}\n`;
      }
    },
  }).prompt() as Promise<string>;
}
