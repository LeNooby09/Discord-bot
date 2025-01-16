// Imports //
import { SlashCommandBuilder } from "discord.js";
import { CommandContext } from "../../types/CommandContext";

// Exports //
export const data = new SlashCommandBuilder()
  .setName("echo")
  .setDescription("Echoes your input")
  .addStringOption((option) =>
    option
      .setName("input")
      .setDescription("The input to echo")
      .setRequired(true)
  );

export async function execute(context: CommandContext) {
  const input = context.interaction.options.getString("input")!;
  await context.interaction.channel?.send(input);
  await context.interaction.reply({ content: "Echoed!", flags: "Ephemeral" });
}
