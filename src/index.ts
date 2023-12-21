#!/usr/bin/env node

import { Command } from "@commander-js/extra-typings";
import AppDataStore from "@store";
import { Logger, handleError } from "@utils";

import { init } from "@src/init.js";
import { selectProject } from "@src/select-project.js";
import { setConfig } from "@src/config.js";

async function main() {
  const appDataStore = new AppDataStore("project-manager");

  const program = new Command()
    .name("project-manager")
    .description(
      "Project Manager is a CLI tool for managing projects and easily navigate between them.",
    )
    .version(Logger.getInfoString(`v${process.env.npm_package_version!}`, true))

    .option("--", "select a project");

  program
    .command("select")
    .description("select a project")
    .action(async () => {
      await selectProject(appDataStore);
    });

  program
    .command("init")
    .description("initialize project manager")
    .action(async () => {
      await init(appDataStore);
    });

  program
    .command("config")
    .description("configure project manager")
    .action(async () => {
      await setConfig(appDataStore);
    });

  try {
    if (process.argv.length === 2) {
      await selectProject(appDataStore);
    } else {
      await program.parseAsync(process.argv);
    }
    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main().catch((err) => {
  Logger.error(err);
  process.exit(1);
});
