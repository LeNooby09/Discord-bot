import { ChatInputCommandInteraction } from "discord.js";
import { DiscordBot } from "../index.js";

export interface CommandContext {
  interaction: ChatInputCommandInteraction;
  bot: DiscordBot;
}
