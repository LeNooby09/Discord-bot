// Imports //
import { SlashCommandBuilder } from "discord.js";
import { CommandContext } from "../../types/CommandContext";
import OpenAI from "openai";

// Constants //
const client = new OpenAI({
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

// Updated execute function to use OpenAI
export async function execute(context: CommandContext) {
  const channel = context.interaction.channel;

  // Acknowledge the interaction
  context.interaction.deferReply();

  // Get user message from command option
  const prompt = context.interaction.options.getString("prompt")!;

  try {
    // Use OpenAI's API to generate response
    const response = await client.chat.completions.create({
      model:
        "DeepSeek-R1-Distill-Qwen-7B-GGUF/DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    // Send response back through the bot
    await context.interaction.followUp(response.choices[0].message.content); // Use followUp to send a message after the initial reply has been acknowledged
  } catch (error) {
    console.error(`Error generating response: ${error.stack}`);
    await context.interaction.followUp(
      "There was an error processing your request.",
    ); // Send an error message if something goes wrong
  }
}
