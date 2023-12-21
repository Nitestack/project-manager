import { platform, homedir } from "node:os";
import { join } from "node:path";
import { lstatSync, readdirSync, existsSync } from "node:fs";
import { outputJson, readJson, pathExists } from "fs-extra/esm";

type Result<ResultData> =
  | {
      success: true;
      data: ResultData;
    }
  | {
      success: false;
      error: string;
    };

interface Config {
  basePath: string;
  subDirectories: string[];
  openWith: string;
  projectDirectories: {
    include: string[];
    exclude: string[];
  };
}

type InputConfig = Omit<
  Partial<Config>,
  "basePath" | "openWith" | "projectDirectories"
> &
  Pick<Config, "basePath" | "openWith"> & {
    projectDirectories: Partial<Config["projectDirectories"]>;
  };

export type PartialConfig = Omit<Partial<Config>, "projectDirectories"> & {
  projectDirectories?: Partial<Config["projectDirectories"]>;
};

export default class AppDataStore {
  private _appDataPath: string;
  private _configFileName = "config.json";

  private get _configPath() {
    return join(this._appDataPath, this._configFileName);
  }

  constructor(store_dir_name: string) {
    let appDataPath = process.env.APPDATA;

    if (!appDataPath) {
      switch (platform()) {
        case "win32":
          appDataPath = this._getWindowsAppDataPath();
          break;
        case "linux":
          appDataPath = this._getLinuxAppDataPath();
          break;
        case "darwin":
          appDataPath = this._getMacAppDataPath();
          break;
        default:
          appDataPath = this._getFallbackAppDataPath();
          break;
      }
    }

    this._appDataPath = join(appDataPath, store_dir_name);
  }

  private _getWindowsAppDataPath() {
    return join(homedir(), "AppData", "Roaming");
  }
  private _getLinuxAppDataPath() {
    return join(homedir(), ".config");
  }
  private _getMacAppDataPath() {
    return join(homedir(), "Library", "Application Support");
  }
  private _getFallbackAppDataPath() {
    if (platform() === "win32") {
      return this._getWindowsAppDataPath();
    } else {
      return this._getLinuxAppDataPath();
    }
  }

  private static _getDirectories(path: string) {
    return readdirSync(path, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => join(path, dirent.name));
  }
  public static getProjectDirectories(
    fullPathSubDirectories: string[],
    fullPathIncludedProjects: string[],
    fullPathExcludeProjects: string[],
  ) {
    const resolvedSubDirectories = fullPathSubDirectories.filter(
      (item) => existsSync(item) && lstatSync(item).isDirectory(),
    );
    const resolvedIncludedProjects = fullPathIncludedProjects.filter(
      (item) => existsSync(item) && lstatSync(item).isDirectory(),
    );
    const resolvedExcludeProjects = fullPathExcludeProjects.filter(
      (item) => existsSync(item) && lstatSync(item).isDirectory(),
    );
    return ([] as string[])
      .concat(...resolvedSubDirectories.map(AppDataStore._getDirectories))
      .filter((dir) => {
        if (resolvedExcludeProjects.includes(dir)) return false;
        return !resolvedSubDirectories.includes(dir);
      })
      .concat(...resolvedIncludedProjects);
  }

  private safeValidateConfig(config: PartialConfig): Result<Config> {
    if (
      !config.basePath ||
      typeof config.basePath !== "string" ||
      !existsSync(config.basePath)
    )
      return {
        success: false,
        error:
          "Invalid project base path in config! Must be a valid directory.",
      };
    if (!config.openWith || typeof config.openWith !== "string")
      return {
        success: false,
        error: "Invalid command in config! Must be a string.",
      };

    if (config.subDirectories && !Array.isArray(config.subDirectories))
      return {
        success: false,
        error:
          "Invalid subdirectories in config! Must be an array of directories.",
      };
    if (
      config.projectDirectories?.include &&
      !Array.isArray(config.projectDirectories.include)
    )
      return {
        success: false,
        error:
          "Invalid project include in config! Must be an array of directories.",
      };
    if (
      config.projectDirectories?.exclude &&
      !Array.isArray(config.projectDirectories.exclude)
    )
      return {
        success: false,
        error:
          "Invalid project exclude in config! Must be an array of directories.",
      };
    return {
      success: true,
      data: {
        basePath: config.basePath,
        subDirectories: config.subDirectories ?? [],
        openWith: config.openWith,
        projectDirectories: {
          include: config.projectDirectories?.include ?? [],
          exclude: config.projectDirectories?.exclude ?? [],
        },
      },
    };
  }
  public async safeGetConfig(): Promise<Result<Config>> {
    try {
      const configExists = await pathExists(this._configPath);
      if (!configExists)
        return {
          success: false,
          error:
            "No config file found. Please initialize project manager first.",
        };
    } catch (err) {
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }

    try {
      const config = await readJson(this._configPath);
      const result = this.safeValidateConfig(config);
      if (!result.success) return result;
      return {
        success: true,
        data: result.data,
      };
    } catch (err) {
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  }
  public async safeConfigExists(): Promise<Result<boolean>> {
    try {
      return {
        success: true,
        data: await pathExists(this._configPath),
      };
    } catch (err) {
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  }
  public async safeCreateConfig(
    config: InputConfig,
  ): Promise<Result<undefined>> {
    const result = this.safeValidateConfig(config);
    if (!result.success) return result;
    try {
      await outputJson(this._configPath, result.data, {
        spaces: 2,
        encoding: "utf-8",
      });
      return {
        success: true,
        data: undefined,
      };
    } catch (err) {
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  }
  public async safeSetConfig(
    config: PartialConfig,
    currentConfig: Config,
  ): Promise<Result<undefined>> {
    try {
      await outputJson(
        this._configPath,
        {
          basePath: config.basePath ?? currentConfig.basePath,
          subDirectories: config.subDirectories ?? currentConfig.subDirectories,
          openWith: config.openWith ?? currentConfig.openWith,
          projectDirectories: {
            include:
              config.projectDirectories?.include ??
              currentConfig.projectDirectories.include,
            exclude:
              config.projectDirectories?.exclude ??
              currentConfig.projectDirectories.exclude,
          },
        } satisfies Config,
        {
          spaces: 2,
          encoding: "utf-8",
        },
      );
      return {
        success: true,
        data: undefined,
      };
    } catch (err) {
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  }
}
