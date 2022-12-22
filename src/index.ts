import { BotOptions, createBot } from "mineflayer";
import { SocksClient } from "socks";
import { Client as Discord, EmbedBuilder, IntentsBitField, Message } from "discord.js";
import dotenv from "dotenv";
import path from "path";
import { readdirSync } from "fs";
import { CommandBase } from "./util/CommandHandler";
import { sanatiseMessage } from "./util/CommonUtils";

dotenv.config();

type AppConfig = {
    hypixelApiKey: string;
};

let appConfig: AppConfig = {
    hypixelApiKey: "",
};

export const getAppConfig = () => {
    return appConfig;
};

export const setAppConfig = (config: AppConfig) => {
    appConfig = config;
};

class MinecraftBot {
    private readonly bot;
    private discord = new Discord({
        intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent],
    });
    private key = "";
    private commandMap: Map<string, CommandBase> = new Map();

    constructor() {
        const username = process.env.MINECRAFT_EMAIL ?? "";
        const proxyHost = process.env.PROXY_IP ?? "";
        const proxyPort = process.env.PROXY_PORT ?? "";
        const proxyUsername = process.env.PROXY_USERNAME ?? "";
        const proxyPassword = process.env.PROXY_PASSWORD ?? "";

        const options: BotOptions = {
            colorsEnabled: true,
            username,
            auth: "microsoft",
            host: "mc.hypixel.net",
            version: "1.8",
        };
        if (proxyHost) {
            options.connect = (client) => {
                SocksClient.createConnection(
                    {
                        proxy: {
                            host: proxyHost,
                            port: parseInt(proxyPort),
                            type: 5,
                            userId: proxyUsername,
                            password: proxyPassword,
                        },
                        command: "connect",
                        destination: {
                            host: "mc.hypixel.net",
                            port: 25565,
                        },
                    },
                    (err, info) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        if (info) client.setSocket(info.socket);
                        client.emit("connect");
                    },
                );
            };
        }
        this.bot = createBot(options);
        this.bot.addChatPattern("guild", /Guild > (.+)/, { parse: true, repeat: true });

        if (process.env.DISCORD_TOKEN) {
            this.discord.login(process.env.DISCORD_TOKEN);
            this.discord.on("messageCreate", async (message) => {
                if (message.channel.id == process.env.DISCORD_LOGGING_CHANNEL && !message.author.bot && message.author.id != this.discord?.user?.id) {
                    this.sendToHypixel(message);
                }
            });
        }else {
            console.log('No discord token in .env file, Not logging to discord!');
        }
    }

    public start= async () =>{
        const commandsPath = path.join(__dirname, "commands");
        const files = readdirSync(commandsPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));

        for (const file of files) {
            const resolvePath = path.join(commandsPath, file);
            const defaultImport = (await import(resolvePath)).default;
            const command = new defaultImport(this.bot);
            this.commandMap.set(`${process.env?.BOT_PREFIX ?? '!'}${command.getName()}`, command);
        }

        await this.startBot();
    }

    public  startBot = ()=> {
        this.bot.on("spawn", async () => {
            this.bot.chat("/api new");
            await this.bot.waitForTicks(40);
            this.bot.chat("/chat g");
        });

        // @ts-ignore
        this.bot.on("chat:guild", async ([[msg]]) => {
            if ( !msg.includes(':') ){
                this.formatDiscordMessage(msg);
                return;
            }
            const player = msg.split(":")[0] as string;
            const message = msg.split(": ")[1] as string;
            const splitMessage = message.split(" ");
            const commandName = splitMessage[0]
            const params = splitMessage.slice(1, splitMessage.length)

            if (this.commandMap.has(commandName)) {
                const commandInstance = this.commandMap.get(commandName);
                if (commandInstance) {
                    commandInstance.execute({ player, message, params });
                }
            }

            if (process.env.DISCORD_TOKEN && sanatiseMessage(player).trim() != this.bot.username) {
                await this.sendToDiscord(`${sanatiseMessage(player)}: ${message}`);
            }
        });

        this.bot.on("message", (msg) => {
            const message = msg.toString();
            const ansiMessage = msg.toAnsi();
            // console.log(ansiMessage);
            if (message.includes("Guild >")) console.log(ansiMessage);

            if (message.includes("Your new API key is")) {
                this.key = message.replace("Your new API key is", "").trim();
                setAppConfig({ ...appConfig, hypixelApiKey: this.key });
                console.log("Key set, bot is ready!");
            }
        });
    }

    public  sendToDiscord= async (message: string | EmbedBuilder) => {
        const channel = await this.discord.channels.cache.get(process.env.DISCORD_LOGGING_CHANNEL ?? "");
        if (channel?.isTextBased()) {
            if (typeof message == "string") {
                await channel.send({ content: `:hypixel: ${message}` });
            } else {
                await channel.send({ embeds: [message]})
            }
        }
    }

    private sendToHypixel = (message: Message) => {
        this.bot.chat(`${message.author.username}> ${message.content} `);
    }

    private formatDiscordMessage = async (message: string)=>{
        const splitMessage = message.split(" ");
        if (message.includes("joined.")) {
            const discordEmbed = new EmbedBuilder().setDescription(`${splitMessage[0]} Joined! `);
            this.sendToDiscord(discordEmbed);
        } else if (message.includes("left")) {
            const discordEmbed = new EmbedBuilder().setDescription(`${splitMessage[0]} left! `);
            this.sendToDiscord(discordEmbed);
        }
    }
}

new MinecraftBot().start();
