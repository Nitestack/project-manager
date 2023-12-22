import { homedir } from "node:os";
import { join } from "node:path";
import {
  getIntro,
  getOptionalString,
  getOutro,
  handleError,
  getDirectoriesFromString,
  validateDirectoryString,
  validateBasePath,
} from "@utils";
import { cancel, group, text } from "@clack/prompts";
import AppDataStore from "@src/store.js";
import { cancelPrompts, configPrompts } from "@prompts";

export async function init(appDataStore: AppDataStore) {
  getIntro();
  const existsConfigResult = await appDataStore.safeConfigExists();
  if (!existsConfigResult.success) return handleError(existsConfigResult.error);
  if (existsConfigResult.data)
    return handleError(
      "Initialization already done. You can start using Project Manager.",
    );
  const configInput = await group(
    {
      basePath: () =>
        text({
          message: configPrompts.basePath(),
          initialValue: join(homedir()),
          validate: validateBasePath,
        }),
      subDirectories: ({ results: { basePath } }) => {
        if (!basePath) return cancel(cancelPrompts.init);
        return text({
          message: configPrompts.subDirectories(basePath),
          placeholder: configPrompts.subDirectoriesExample,
          validate: validateDirectoryString(basePath),
        });
      },
      openWith: () =>
        text({
          message: configPrompts.openWith(),
          placeholder: configPrompts.openWithExample,
          validate: (value) => {
            if (!value) return "Command cannot be empty";
          },
        }),
      projectInclude: ({ results: { basePath } }) => {
        if (!basePath) return cancel(cancelPrompts.init);
        return text({
          message: getOptionalString(configPrompts.projectInclude()),
          placeholder: configPrompts.projectIncludeExample,
          validate: validateDirectoryString(basePath, true),
        });
      },
      projectExclude: ({ results: { basePath } }) => {
        if (!basePath) return cancel(cancelPrompts.init);
        return text({
          message: getOptionalString(configPrompts.projectExclude(basePath)),
          placeholder: configPrompts.projectExcludeExample,
          validate: validateDirectoryString(basePath),
        });
      },
    },
    {
      onCancel: () => {
        cancel(cancelPrompts.init);
        process.exit(0);
      },
    },
  );
  const result = await appDataStore.safeCreateConfig({
    basePath: configInput.basePath,
    subDirectories: getDirectoriesFromString(configInput.subDirectories),
    projectDirectories: {
      include: getDirectoriesFromString(configInput.projectInclude),
      exclude: getDirectoriesFromString(configInput.projectExclude),
    },
    openWith: configInput.openWith,
  });
  if (!result.success) return handleError(result.error);
  getOutro("Initialization done. You can start using Project Manager.");
}
