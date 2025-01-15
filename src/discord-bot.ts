import {
  CacheType,
  ChatInputCommandInteraction,
  Client,
  Events,
  GatewayIntentBits,
  Interaction,
  InteractionReplyOptions,
  MessageFlags,
  REST,
  Routes,
} from "discord.js";
import * as logger from "./logger.js";
import { CommandImplementation } from "./types/CommandImplementation.js";
import { CommandContext } from "./types/CommandContext.js";
import { fetchCommandImplementations } from "./commands/index.js";

const CLIENT_OPTIONS = {
  intents: [GatewayIntentBits.Guilds],
};
const ERROR_REPLY_OPTIONS: InteractionReplyOptions = {
  content: "There was an error while executing this command!",
  flags: MessageFlags.Ephemeral,
};

export class DiscordBot {
  private readonly token: string;
  private readonly client: Client;
  private commands?: Map<string, CommandImplementation>;

  constructor(token: string) {
    this.token = token;
    this.client = DiscordBot.createClient();
  }

  private static createClient() {
    const client = new Client(CLIENT_OPTIONS);
    if (!client) {
      logger.fatal("Failed to create a new Discord client.");
    }
    return client;
  }

  private async pushCommandsToDiscord() {
    if (!this.client?.user?.id) {
      logger.fatal("Client is not ready to push commands.");
    }

    const rest = new REST().setToken(this.token);
    const commandData = Array.from(this.commands.values()).map((command) =>
      command.data.toJSON()
    );
    try {
      await rest.put(Routes.applicationCommands(this.client.user.id), {
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

  private onReady(readyClient: Client) {
    logger.success(`Ready! Logged in as ${readyClient.user.tag}.`);
  }

  private async onInteractionCreate(interaction: Interaction) {
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
    interaction: ChatInputCommandInteraction<CacheType>
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

    this.client.once(Events.ClientReady, this.onReady.bind(this));
    this.client.on(
      Events.InteractionCreate,
      this.onInteractionCreate.bind(this)
    );
  }
}
