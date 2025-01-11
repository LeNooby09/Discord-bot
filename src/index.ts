import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { createRequire } from "module";
import { CommandImplementation } from "./types/CommandImplementation.js";
import { CommandContext } from "./types/CommandContext.js";

import commands from "./commands/index.js";

const require = createRequire(import.meta.url);
const config = await require("../config.json");

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
  public async setup() {
    this.client.once(Events.ClientReady, (readyClient) => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commands.get(interaction.commandName);
      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      try {
        const context: CommandContext = { interaction, bot: this };
        await command.execute(context);
      } catch (error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    });
  }
  public login() {
    this.client.login(this.token);
  }
}

const bot = new DiscordBot(config.token);
await bot.setup();
bot.login();
