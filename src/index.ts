import fs from "fs";
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
import { CommandImplementation } from "./types/CommandImplementation.js";
import { CommandContext } from "./types/CommandContext.js";
import { fetchCommandImplementations } from "./commands/index.js";

const CLIENT_OPTIONS = {
  intents: [GatewayIntentBits.Guilds],
};
const CONFIG_PATH = "./config.json";
const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
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
      console.error("Failed to create a new Discord client.");
      process.exit(1);
    }
    return client;
  }

  private async pushCommandsToDiscord() {
    const rest = new REST().setToken(this.token);
    const commandData = this.commands.forEach((command) =>
      command.data.toJSON()
    );
    try {
      await rest.put(
        Routes.applicationGuildCommands(this.client.user.id, CONFIG.guildId),
        { body: commandData }
      );
      console.log(`Successfully registered commands.`);
    } catch (error) {
      console.error(`Failed to register commands: ${error}`);
    }
  }
  private async fetchCommands() {
    this.commands = await fetchCommandImplementations();
    if (!this.commands) {
      console.error("Failed to fetch command implementations.");
      process.exit(1);
    }

    await this.pushCommandsToDiscord();
  }
  private onReady(readyClient: Client) {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  }
  private async onInteractionCreate(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commands.get(interaction.commandName);
    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    const context: CommandContext = { interaction, bot: this };
    try {
      await command.execute(context);
    } catch (error) {
      console.error(error);
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
    await this.client.login(this.token);
    await this.fetchCommands();

    this.client.once(Events.ClientReady, this.onReady.bind(this));
    this.client.on(
      Events.InteractionCreate,
      this.onInteractionCreate.bind(this)
    );
  }
}

const bot = new DiscordBot(CONFIG.token);
await bot.setup();
