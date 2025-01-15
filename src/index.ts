import fs from "fs";
import { DiscordBot } from "./discord-bot.js";

const CONFIG_PATH = "./config.json";
const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

const bot = new DiscordBot(CONFIG.token);
await bot.setup();
