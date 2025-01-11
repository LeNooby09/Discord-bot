import fs from "fs";
import path from "path";
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
} from "discord.js";

const config = await import("../config.json", { assert: { type: "json" } });
const FOLDERS_PATH = path.join(import.meta.dirname, "commands");
const COMMAND_FOLDERS = fs.readdirSync(FOLDERS_PATH);

interface CommandImplementation {
  data: { name: string };
  execute: Function;
}

class DiscordBot {
  public client: Client;
  public commands: Collection<string, any>;
  private token: string;

  constructor(token: string) {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });
    if (!this.client) {
      console.error("Failed to create a new Discord client.");
      process.exit(1);
    }

    this.commands = new Collection();
    this.token = token;
  }
  public async findCommands() {
    for (const folder of COMMAND_FOLDERS) {
      const commandsPath = path.join(FOLDERS_PATH, folder);
      const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = (await import(filePath)) as CommandImplementation;
        if ("data" in command && "execute" in command) {
          this.commands.set(command.data!.name, command);
        } else {
          console.log(
            `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
          );
        }
      }
    }
  }
  public async setup() {
    await this.findCommands();

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
        await command.execute(interaction);
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
