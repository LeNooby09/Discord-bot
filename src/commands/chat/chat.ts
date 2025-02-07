// Imports //
import { SlashCommandBuilder } from "discord.js";
import { CommandContext } from "../../types/CommandContext";
import OpenAI from "openai";

// Constants //
const aiClient = new OpenAI({
  baseURL: "http://localhost:1234/v1",
  apiKey: "lm-studio",
});

// Exports //
export const data = new SlashCommandBuilder()
  .setName("chat")
  .setDescription("chat with the bot")
  .addStringOption((option) =>
    option
      .setName("prompt")
      .setDescription("Your prompt for the bot")
      .setRequired(true),
  );

export async function execute(context: CommandContext) {
  context.interaction.deferReply();

  const prompt = context.interaction.options.getString("prompt")!;

  const response = await aiClient.chat.completions.create({
    model: "topicalstorm-llama3.1-8b",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
  });

  await context.interaction.followUp({
    content: response.choices[0].message.content,
  });
}
