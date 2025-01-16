// Imports //
import { ChatInputCommandInteraction } from "discord.js";
import { DiscordBot } from "../discord-bot.js";

// Exports //
export interface CommandContext {
  interaction: ChatInputCommandInteraction;
  bot: DiscordBot;
}
