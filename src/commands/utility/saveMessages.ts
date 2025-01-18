// Imports //
import fs from "fs";
import zlib from "zlib";
import * as logger from "../../logger.js";

import { SlashCommandBuilder, TextChannel } from "discord.js";
import { CommandContext } from "../../types/CommandContext";

// Constants //
const TMP_DIRECTORY = "/tmp/DiscordBot/";
const DEFAULT_FILENAME = "messages";
const FILENAME_POSTFIX = ".json.gz";
const VALID_FILENAME_REGEX = /^[a-zA-Z0-9-_]+$/;

// Local Functions //
function createTempDirectoryIfNotExists() {
  if (!fs.existsSync(TMP_DIRECTORY)) {
    fs.mkdirSync(TMP_DIRECTORY);
    logger.info("Created temporary directory for saving messages.");
  }
}
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
      messages.push({
        id: message.id,
        author: message.author.id,
        content: message.content,
        timestamp: message.createdTimestamp,
      });
    });

    messageIdCursor = fetchedMessages.last()!.id;
  }

  return messages;
}
function jsonAndGzipMessages(messages: any[]) {
  const messagesString = JSON.stringify(messages);
  const messagesBuffer = Buffer.from(messagesString, "utf-8");
  return zlib.gzipSync(messagesBuffer);
}
function cleanUpFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// Exports //
export const data = new SlashCommandBuilder()
  .setName("save-messages")
  .setDescription("Saves all messages in the channel to a JSON file")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("The channel to save messages from")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("filename")
      .setDescription("The name of the file to save to")
      .setRequired(false)
  );

export async function execute(context: CommandContext) {
  createTempDirectoryIfNotExists();
  const channel =
    context.interaction.options.getChannel("channel") ??
    context.interaction.channel;
  const filename =
    context.interaction.options.getString("filename") ?? DEFAULT_FILENAME;

  if (!(channel instanceof TextChannel)) {
    await context.interaction.reply({
      content: "This command only works in text channels",
      flags: "Ephemeral",
    });
    return;
  }
  if (!filename.match(VALID_FILENAME_REGEX)) {
    await context.interaction.reply({
      content:
        "Invalid filename. Only alphanumeric characters, hyphens, and underscores are allowed.",
      flags: "Ephemeral",
    });
    return;
  }

  const messages = await fetchAllMessages(channel, context.interaction.id);

  // Save messages to file
  const realFilePath = TMP_DIRECTORY + filename + FILENAME_POSTFIX;
  const gzippedMessages = jsonAndGzipMessages(messages);
  fs.writeFileSync(realFilePath, gzippedMessages);

  await context.interaction.reply({
    content: `Saved messages to ${filename}${FILENAME_POSTFIX}, size: ${gzippedMessages.length} bytes`,
    files: [realFilePath],
  });

  cleanUpFile(realFilePath);
}
