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
} from "discord.js";
import { CommandImplementation } from "./types/CommandImplementation.js";
import { CommandContext } from "./types/CommandContext.js";
import commands from "./commands/index.js";

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
  public client: Client;
  public commands: Map<string, CommandImplementation>;
  private token: string;

  constructor(token: string) {
    this.client = DiscordBot.createClient();
    this.commands = commands;
    this.token = token;
  }

  private static createClient() {
    const client = new Client(CLIENT_OPTIONS);
    if (!client) {
      console.error("Failed to create a new Discord client.");
      process.exit(1);
    }
    return client;
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
    this.client.once(Events.ClientReady, this.onReady.bind(this));
    this.client.on(
      Events.InteractionCreate,
      this.onInteractionCreate.bind(this)
    );
  }
  public login() {
    this.client.login(this.token);
  }
}

const bot = new DiscordBot(CONFIG.token);
await bot.setup();
bot.login();
