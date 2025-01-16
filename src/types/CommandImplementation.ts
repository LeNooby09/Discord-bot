// Imports //
import { SlashCommandBuilder } from "discord.js";

// Exports //
export interface CommandImplementation {
  data: SlashCommandBuilder;
  execute: Function;
}
