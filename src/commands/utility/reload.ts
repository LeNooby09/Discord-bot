import { SlashCommandBuilder } from "discord.js";
import { CommandContext } from "../../types/CommandContext";

export const data = new SlashCommandBuilder()
  .setName("reload")
  .setDescription("Reloads all commands");

export async function execute(context: CommandContext) {
  await context.bot.fetchCommands();
  await context.interaction.reply("Reloaded commands.");
}
