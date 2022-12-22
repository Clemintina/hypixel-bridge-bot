import { BotOptions, createBot } from "mineflayer";
import { SocksClient } from "socks";
import { Client as Discord, EmbedBuilder, IntentsBitField, Message, REST, Routes, SlashCommandBuilder } from "discord.js";
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
            const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

            const commands = [
                new SlashCommandBuilder()
                    .setName("kick")
                    .setDescription("Kicks a player from the guild")
                    .addStringOption((options) => {
                        options.setName("player_name").setDescription("The name of the player to kick.").setRequired(true);
                        return options;
                    })
                    .addStringOption((options) => {
                        options.setName("reason").setDescription("Reason to kick the player").setRequired(true);
                        return options;
                    }),
            ];

            rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, process.env.DISCORD_GUILD_ID!), { body: commands }).then(() => console.log("PUT discord commands"));
        } else {
            console.log("No discord token in .env file, Not logging to discord!");
        }
    }

    public start = async () => {
        const commandsPath = path.join(__dirname, "commands");
        const files = readdirSync(commandsPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));

        for (const file of files) {
            const resolvePath = path.join(commandsPath, file);
            const defaultImport = (await import(resolvePath)).default;
            const command = new defaultImport(this.bot);
            this.commandMap.set(`${process.env?.BOT_PREFIX ?? "!"}${command.getName()}`, command);
        }

        await this.startBot();
    };

    public startBot = () => {
        this.bot.on("spawn", async () => {
            this.bot.chat("/api new");
            await this.bot.waitForTicks(40);
            this.bot.chat("/chat g");
            // Force Limbo
            for (let i = 0; i < 20; i++) {
                this.bot.chat("/limvo");
            }
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.bot.on("chat:guild", async ([[msg]]) => {
            if (!msg.includes(":")) {
                this.formatDiscordMessage(msg);
                return;
            }
            const player = msg.split(":")[0] as string;
            const message = msg.split(": ")[1] as string;
            const splitMessage = message.split(" ");
            const commandName = splitMessage[0];
            const params = splitMessage.slice(1, splitMessage.length);

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
            console.log(ansiMessage);
            if (message.includes("Guild >")) console.log(ansiMessage);

            if (message.includes("Your new API key is")) {
                this.key = message.replace("Your new API key is", "").trim();
                setAppConfig({ ...appConfig, hypixelApiKey: this.key });
                console.log("Key set, bot is ready!");
            }
        });

        this.discord.on("messageCreate", async (message) => {
            const { bot, id } = message.author;
            if (message.channel.id == process.env.DISCORD_LOGGING_CHANNEL && !bot && id != this.discord?.user?.id) {
                this.sendToHypixel(message);
            }
        });
        this.discord.on("interactionCreate", async (interaction) => {
            if (interaction.member && interaction.isCommand()) {
                const guild = this.discord.guilds.cache.get(process.env.DISCORD_GUILD_ID!);
                if (guild) {
                    const member = await guild.members.cache.get(interaction.user.id);
                    if (member && member.roles.cache.has(process.env.DISCORD_ADMIN_ROLE!)) {
                        await interaction.deferReply({ fetchReply: true });
                        if (interaction.commandName == "kick") {
                            await this.bot.chat(`/g kick ${interaction.options.get("username")?.value} ${interaction.options.get("reason")?.value}`);
                            await interaction.editReply("Command has been executed!");
                        }
                    } else {
                        await interaction.reply(`You don't have the required permissions to execute this command!`);
                    }
                }
            }
        });
    };

    public sendToDiscord = async (message: string | EmbedBuilder) => {
        const channel = await this.discord.channels.cache.get(process.env.DISCORD_LOGGING_CHANNEL ?? "");
        if (channel?.isTextBased()) {
            if (typeof message == "string") {
                await channel.send({ content: `:hypixel: ${message}` });
            } else {
                await channel.send({ embeds: [message] });
            }
        }
    };

    private sendToHypixel = (message: Message) => {
        this.bot.chat(`${message.author.username}> ${message.content} `);
    };

    private formatDiscordMessage = async (message: string) => {
        const splitMessage = message.split(" ");
        if (message.includes("joined.")) {
            const discordEmbed = new EmbedBuilder().setDescription(`${splitMessage[0]} Joined! `);
            this.sendToDiscord(discordEmbed);
        } else if (message.includes("left")) {
            const discordEmbed = new EmbedBuilder().setDescription(`${splitMessage[0]} left! `);
            this.sendToDiscord(discordEmbed);
        }
    };
}

new MinecraftBot().start();
