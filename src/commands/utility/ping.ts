import { SlashCommandBuilder } from "discord.js";
import { CommandContext } from "../../types/CommandContext";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!");

export async function execute(context: CommandContext) {
  await context.interaction.reply(
    `Pong! Latency is ${Date.now() - context.interaction.createdTimestamp}ms.`
  );
}
