import { join, sep } from "node:path";
import { execa } from "execa";
import AppDataStore from "@src/store.js";
import {
  fuzzySearch,
  getIntro,
  getOutro,
  handleCancel,
  handleError,
} from "@utils";

export async function selectProject(appDataStore: AppDataStore) {
  getIntro();
  const result = await appDataStore.safeGetConfig();
  if (!result.success) return handleError(result.error);
  const { data: config } = result;
  const projectDirectories = AppDataStore.getProjectDirectories(
    config.subDirectories.map((subDir) => join(config.basePath, subDir)),
    config.projectDirectories.include.map((dir) => join(config.basePath, dir)),
    config.projectDirectories.exclude.map((dir) => join(config.basePath, dir)),
  ).map((path) => path.replace(config.basePath + sep, ""));
  const selection = await fuzzySearch({
    items: projectDirectories,
    message: `Enter a project directory (relative to '${config.basePath}')`,
  });
  handleCancel(selection, "Project selection cancelled.");
  if (config.openWith) {
    await execa(config.openWith, {
      cwd: join(config.basePath, selection),
      stdio: "inherit",
    });
  }
  getOutro();
}
