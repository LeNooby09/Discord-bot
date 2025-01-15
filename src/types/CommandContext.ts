import { ChatInputCommandInteraction } from "discord.js";
import { DiscordBot } from "../discord-bot.js";

export interface CommandContext {
  interaction: ChatInputCommandInteraction;
  bot: DiscordBot;
}
