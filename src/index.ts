import fs from "fs";
import {
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

const CONFIG = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

export class DiscordBot {
  public client: Client;
  public commands: Map<string, CommandImplementation>;
  private token: string;

  constructor(token: string) {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });
    if (!this.client) {
      console.error("Failed to create a new Discord client.");
      process.exit(1);
    }

    this.commands = commands;
    this.token = token;
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

      const replyOptions: InteractionReplyOptions = {
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyOptions);
      } else {
        await interaction.reply(replyOptions);
      }
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
