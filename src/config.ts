import { cancel, group, multiselect, text } from "@clack/prompts";
import AppDataStore, { PartialConfig } from "@store";
import {
  getDirectoriesFromString,
  getIntro,
  getOutro,
  handleCancel,
  handleError,
  validateBasePath,
  validateDirectoryString,
} from "@utils";
import { configPrompts, setConfigPrompts } from "@prompts";

function directoriesToString(directories: string[], forInput = false) {
  if (forInput) return directories.length ? directories.join(", ") : "";
  return directories.length ? `'${directories.join("', '")}'` : "none";
}

type ConfigKey =
  | "basePath"
  | "subDirectories"
  | "openWith"
  | "include"
  | "exclude";

export async function setConfig(appDataStore: AppDataStore) {
  getIntro();

  const configResult = await appDataStore.safeGetConfig();
  if (!configResult.success) return handleError(configResult.error);

  const { data: config } = configResult;
  const selection = (await multiselect({
    message: "Select option(s) to edit",
    options: [
      {
        label: "Base path",
        value: "basePath" satisfies ConfigKey,
        hint: `current: '${config.basePath}'`,
      },
      {
        label: "Subdirectories",
        value: "subDirectories" satisfies ConfigKey,
        hint: `current: ${directoriesToString(config.subDirectories)}`,
      },
      {
        label: "Command to open projects with",
        value: "openWith" satisfies ConfigKey,
        hint: `current: '${config.openWith}'`,
      },
      {
        label: "Included projects",
        value: "include" satisfies ConfigKey,
        hint: `current: ${directoriesToString(
          config.projectDirectories.include,
        )}`,
      },
      {
        label: "Excluded projects",
        value: "exclude" satisfies ConfigKey,
        hint: `current: ${directoriesToString(
          config.projectDirectories.exclude,
        )}`,
      },
    ],
    required: true,
  })) as ConfigKey[];
  handleCancel(selection, setConfigPrompts.cancelled());
  const newConfig: Omit<
    PartialConfig,
    "subDirectories" | "projectDirectories"
  > & {
    subDirectories?: string;
    includeProjects?: string;
    excludeProjects?: string;
  } = await group(
    {
      ...(selection.includes("basePath") && {
        basePath: () =>
          text({
            message: configPrompts.basePath(),
            initialValue: config.basePath,
            validate: validateBasePath,
          }),
      }),
      ...(selection.includes("subDirectories") && {
        // @ts-expect-error Type definitions doesn't work here
        subDirectories: ({ results: { basePath } }) =>
          text({
            message: configPrompts.subDirectories(basePath ?? config.basePath),
            initialValue: config.subDirectories.length
              ? directoriesToString(config.subDirectories, true)
              : undefined,
            placeholder: !config.subDirectories.length
              ? configPrompts.subDirectoriesExample
              : undefined,
            validate: validateDirectoryString(basePath ?? config.basePath),
          }),
      }),
      ...(selection.includes("openWith") && {
        openWith: () =>
          text({
            message: configPrompts.openWith(),
            initialValue: config.openWith ?? undefined,
            placeholder: !config.openWith
              ? configPrompts.openWithExample
              : undefined,
          }),
      }),
      ...(selection.includes("include") && {
        // @ts-expect-error Type inference doesn't work here
        includeProjects: ({ results: { basePath } }) =>
          text({
            message: configPrompts.projectInclude(basePath ?? config.basePath),
            initialValue: config.projectDirectories.include.length
              ? directoriesToString(config.projectDirectories.include, true)
              : undefined,
            placeholder: !config.projectDirectories.include.length
              ? configPrompts.projectIncludeExample
              : undefined,
            validate: validateDirectoryString(basePath ?? config.basePath),
          }),
      }),
      ...(selection.includes("exclude") && {
        // @ts-expect-error Type inference doesn't work here
        excludeProjects: ({ results: { basePath } }) =>
          text({
            message: configPrompts.projectExclude(basePath ?? config.basePath),
            initialValue: config.projectDirectories.exclude.length
              ? directoriesToString(config.projectDirectories.exclude, true)
              : undefined,
            placeholder: !config.projectDirectories.exclude.length
              ? configPrompts.projectExcludeExample
              : undefined,
            validate: validateDirectoryString(basePath ?? config.basePath),
          }),
      }),
    },
    {
      onCancel: () => {
        cancel(setConfigPrompts.cancelled());
        process.exit(0);
      },
    },
  );
  const result = await appDataStore.safeSetConfig(
    {
      basePath: newConfig.basePath,
      subDirectories: selection.includes("subDirectories")
        ? getDirectoriesFromString(newConfig.subDirectories)
        : undefined,
      projectDirectories: {
        include: selection.includes("include")
          ? getDirectoriesFromString(newConfig.includeProjects)
          : undefined,
        exclude: selection.includes("exclude")
          ? getDirectoriesFromString(newConfig.excludeProjects)
          : undefined,
      },
      openWith: newConfig.openWith,
    },
    config,
  );
  if (!result.success) return handleError(result.error);
  getOutro(setConfigPrompts.done());
}
