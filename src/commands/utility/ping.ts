import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!");

export async function execute(interaction) {
  await interaction.reply(
    `Pong! Latency is ${Date.now() - interaction.createdTimestamp}ms.`
  );
}
