// Imports //
import {
  AttachmentBuilder,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { CommandContext } from "../../types/CommandContext";

// Constants //
const JSON_FILENAME = "messages-{CHANNEL_ID}.json";

// Interfaces //
interface MessageData {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  replyToMessageId?: string;
}

// Local Functions //
async function fetchAllMessages(channel: TextChannel, interactionId: string) {
  const messages = [];
  let messageIdCursor = interactionId;

  while (true) {
    const fetchedMessages = await channel.messages.fetch({
      before: messageIdCursor,
      limit: 100,
    });

    if (fetchedMessages.size === 0) break;

    fetchedMessages.forEach((message) => {
      const messageData: MessageData = {
        id: message.id,
        author: message.author.id,
        content: message.content,
        timestamp: message.createdTimestamp,
        replyToMessageId: message.reference?.messageId,
      };

      messages.push(messageData);
    });

    messageIdCursor = fetchedMessages.last()!.id;
  }

  return messages;
}
function formatString(template: string, replacements: Record<string, string>) {
  return template.replace(/{(.*?)}/g, (_match, key) => replacements[key] ?? "");
}

// Exports //
export const data = new SlashCommandBuilder()
  .setName("save-messages")
  .setDescription("Saves all messages in the channel to a JSON file");

export async function execute(context: CommandContext) {
  const channel = context.interaction.channel;
  if (!(channel instanceof TextChannel)) {
    await context.interaction.reply({
      content: "This command only works in text channels",
      flags: "Ephemeral",
    });
    return;
  }

  // Acknowledge the interaction
  await context.interaction.deferReply();

  // Fetch all messages in the channel
  const messages = await fetchAllMessages(channel, context.interaction.id);
  const messagesJSON = JSON.stringify(messages);

  // Create an attachment with the JSON data of the messages
  const formatReplacements = {
    CHANNEL_ID: context.interaction.channelId,
    INTERACTION_ID: context.interaction.id,
  };
  const fileName = formatString(JSON_FILENAME, formatReplacements);
  const savedMessagesAttachment = new AttachmentBuilder(
    Buffer.from(messagesJSON, "utf-8"),
    {
      name: fileName,
    }
  );

  // Edit the "Bot is thinking" message with the saved messages
  await context.interaction.editReply({
    content: `Saved messages (${messages.length} messages)`,
    files: [savedMessagesAttachment],
  });
}
