import { homedir } from "os";
import { multilinePrompt } from "@utils";

export const configPrompts = {
  basePath: () =>
    multilinePrompt(
      `Where do you store your projects? (must be inside '${homedir()}')`,
    ),
  subDirectories: (basePath: string) =>
    multilinePrompt(
      `Which subdirectories do you store your projects in?\nSeparate them with a comma\n(must be inside '${basePath}', only specify relative paths)`,
    ),
  openWith: () =>
    multilinePrompt(
      "Which program do you want to open your projects with?\n(the current working directory will be the selected project directory)",
    ),
  projectInclude: (basePath: string) =>
    multilinePrompt(
      `Which projects do you want to include?\nSeparate them with a comma\n(must be inside '${basePath}', only specify relative paths)`,
    ),
  projectExclude: (basePath: string) =>
    multilinePrompt(
      `Which projects/directories do you want to exclude?\nSeparate them with a comma\n(must be inside of a subdirectory you specified,\nonly specify relative path to '${basePath}')`,
    ),
  subDirectoriesExample: "For example: nodejs/cli-tools, nodejs/web-apps",
  projectIncludeExample: "For example: nodejs/portfolio",
  projectExcludeExample: "For example: nodejs/portfolio/backend",
  openWithExample: "For example: code .",
};

export const cancelPrompts = {
  init: "Initialization cancelled.",
  config: "Configuration cancelled.",
};

export const setConfigPrompts = {
  done: () => "Overriden config. You can continue using Project Manager.",
  cancelled: () => "Configuration cancelled.",
};
