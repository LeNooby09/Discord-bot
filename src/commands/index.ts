import fs from "fs";
import path from "path";
import { CommandImplementation } from "../types/CommandImplementation";

const COMMANDS: Map<string, CommandImplementation> = new Map();
const DIRNAME = import.meta.dirname;
const COMMANDS_PATH = DIRNAME;
const DIRECTORIES = fs
  .readdirSync(COMMANDS_PATH)
  .filter((file) => !(file.endsWith(".js") || file.endsWith(".ts")));
const COMMAND_FILES: string[] = DIRECTORIES.flatMap((directory) =>
  fs
    .readdirSync(path.join(COMMANDS_PATH, directory))
    .map((file) => path.join(directory, file))
);

for (const file of COMMAND_FILES) {
  const filePath = path.join(COMMANDS_PATH, file);
  const implementation = (await import(filePath)) as CommandImplementation;

  COMMANDS.set(implementation.data.name, implementation);
}

export default COMMANDS;
