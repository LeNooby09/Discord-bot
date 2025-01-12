import fs from "fs";
import path from "path";
import { CommandImplementation } from "../types/CommandImplementation";

const COMMANDS: Map<string, CommandImplementation> = new Map();
const COMMAND_PATH = import.meta.dirname;
const COMMAND_FILES = fs
  .readdirSync(COMMAND_PATH)
  .filter((file) => !file.includes(".")) // Check if not a directory
  .flatMap((directory) =>
    fs
      .readdirSync(path.join(COMMAND_PATH, directory))
      .map((file) => path.join(directory, file))
  );

for (const file of COMMAND_FILES) {
  const filePath = path.join(COMMAND_PATH, file);
  const implementation: CommandImplementation = await import(filePath);
  if (!implementation.data || !implementation.execute) {
    console.error(`Command file "${filePath}" is missing "data" or "execute".`);
    continue;
  }

  COMMANDS.set(implementation.data.name, implementation);
}

export default COMMANDS;
