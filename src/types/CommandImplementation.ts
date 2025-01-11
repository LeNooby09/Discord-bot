import { SlashCommandBuilder } from "discord.js";

export interface CommandImplementation {
  data: SlashCommandBuilder;
  execute: Function;
}
