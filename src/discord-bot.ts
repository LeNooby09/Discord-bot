// Imports //
import * as Discord from "discord.js";
import * as logger from "./logger.js";

import { CommandImplementation } from "./types/CommandImplementation.js";
import { CommandContext } from "./types/CommandContext.js";
import { fetchCommandImplementations } from "./commands/index.js";

// Constants //
const CLIENT_OPTIONS = {
  intents: [Discord.GatewayIntentBits.Guilds],
};
const ERROR_REPLY_OPTIONS: Discord.InteractionReplyOptions = {
  content: "There was an error while executing this command!",
  flags: Discord.MessageFlags.Ephemeral,
};

// DiscordBot //
export class DiscordBot {
  private readonly token: string;
  private readonly client: Discord.Client;
  private commands?: Map<string, CommandImplementation>;

  constructor(token: string) {
    this.token = token;
    this.client = DiscordBot.createClient();
  }

  private static createClient() {
    const client = new Discord.Client(CLIENT_OPTIONS);
    if (!client) {
      logger.fatal("Failed to create a new Discord client.");
    }
    return client;
  }

  private async pushCommandsToDiscord() {
    if (!this.client?.user?.id) {
      logger.fatal("Client is not ready to push commands.");
    }

    const rest = new Discord.REST().setToken(this.token);
    const commandData = Array.from(this.commands.values()).map((command) =>
      command.data.toJSON()
    );
    try {
      await rest.put(Discord.Routes.applicationCommands(this.client.user.id), {
        body: commandData,
      });
      logger.success(`Registered commands.`);
    } catch (error) {
      logger.error(`Failed to register commands: ${error.stack}`);
    }
  }

  public async fetchCommands() {
    this.commands = await fetchCommandImplementations();
    if (!this.commands) {
      logger.fatal("Failed to fetch command implementations.");
    }

    for (const command of this.commands.values()) {
      logger.info(`Fetched command: ${command.data.name}`);
    }
    await this.pushCommandsToDiscord();
  }

  private onReady(readyClient: Discord.Client) {
    logger.success(`Ready! Logged in as ${readyClient.user.tag}.`);
  }

  private async onInteractionCreate(interaction: Discord.Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commands.get(interaction.commandName);
    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    const context: CommandContext = { interaction, bot: this };
    try {
      await command.execute(context);
    } catch (error) {
      logger.error(`Error while executing command: ${error.stack}`);
      await this.replyWithError(interaction);
    }
  }

  private async replyWithError(
    interaction: Discord.ChatInputCommandInteraction<Discord.CacheType>
  ) {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(ERROR_REPLY_OPTIONS);
    } else {
      await interaction.reply(ERROR_REPLY_OPTIONS);
    }
  }

  public async setup() {
    await this.client.login(this.token).catch((error) => {
      logger.fatal(`Failed to login: ${error.stack}`);
    });
    await this.fetchCommands();

    this.client.once(Discord.Events.ClientReady, this.onReady.bind(this));
    this.client.on(
      Discord.Events.InteractionCreate,
      this.onInteractionCreate.bind(this)
    );
  }
}
