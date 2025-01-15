import fs from "fs";
import path from "path";
import * as logger from "../logger.js";
import { CommandImplementation } from "../types/CommandImplementation";

const COMMAND_PATH = import.meta.dirname;

function getCommandFiles(): string[] {
  return (
    fs
      .readdirSync(COMMAND_PATH)
      .filter((file) =>
        fs.statSync(path.join(COMMAND_PATH, file)).isDirectory()
      )
      // Get all files in all directories
      .flatMap((directory) =>
        fs
          .readdirSync(path.join(COMMAND_PATH, directory))
          .map((file) => path.join(directory, file))
      )
  );
}

function checkIfValidCommandImplementation(
  implementation: CommandImplementation
) {
  if (!implementation.data || !implementation.execute) {
    logger.warning(
      `Command file is missing "data" or "execute". Skipping command.`
    );
    return false;
  }
  return true;
}

export async function fetchCommandImplementations() {
  const commandFiles = getCommandFiles();
  const commandImplementations: Map<string, CommandImplementation> = new Map();

  for (const file of commandFiles) {
    const filePath = path.join(COMMAND_PATH, file);
    const implementation: CommandImplementation = await import(filePath);
    if (!checkIfValidCommandImplementation(implementation)) continue;

    commandImplementations.set(implementation.data.name, implementation);
  }

  return commandImplementations;
}
