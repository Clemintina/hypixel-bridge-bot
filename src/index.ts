import { Bot, BotOptions, createBot } from "mineflayer";
import { SocksClient } from "socks";
import { ChatInputCommandInteraction, Client as Discord, EmbedBuilder, IntentsBitField, Message, REST, Routes } from "discord.js";
import { config as dotenvConfig } from "dotenv";
import path from "path";
import { readdirSync } from "fs";
import { CommandBase } from "./util/CommandHandler";
import { CommandBase as SlashCommandBase, CommandRegister } from "./util/SlashCommandHandler";
import { logToConsole, sanatiseMessage } from "./util/CommonUtils";

import "json5/lib/register";
import axios from "axios";
import { ConfigFile, PlayerDB, PlayerMapObject } from "./util/CustomTypes";
import { getPlayerRank } from "@zikeji/hypixel";
import { SeraphCache } from "./util/SeraphCache";

export const config = require("../config.json5") as ConfigFile;

dotenvConfig();

export class MinecraftBot {
	private readonly bot: Bot;
	private discord = new Discord({
		intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent],
	});
	private isBotMuted = false;
	private commandMap: Map<string, CommandBase> = new Map();
	private playerCache: Map<string, PlayerMapObject> = new Map<string, PlayerMapObject>();
	private discordCommandMap = new Map<string, SlashCommandBase>();

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
							logToConsole("error", err);
							return;
						}
						if (info) client.setSocket(info.socket);
						client.emit("connect");
					},
				);
			};
		}
		this.bot = createBot(options);

		if (process.env.DISCORD_TOKEN) {
			logToConsole("info", "Logging in to Discord");
			this.discord.login(process.env.DISCORD_TOKEN).then(async () => {
				logToConsole("info", "Fetching commands from files");
				// Discord Slash command register
				const discordCommandPaths = readdirSync(path.join(__dirname, "discord"), { withFileTypes: true })
					.filter((dirent) => dirent.isDirectory())
					.map((dirent) => dirent.name);
				const discordCommands: CommandRegister["commandBuilder"][] = [];
				for (const commandPathRaw of discordCommandPaths) {
					const discordCommandsPath = path.join(__dirname, "discord", commandPathRaw);
					const files = readdirSync(discordCommandsPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));
					for (const file of files) {
						const resolvePath = path.join(discordCommandsPath, file);
						const defaultImport = (await import(resolvePath)).default;
						const command = new defaultImport(this.discord, this);
						discordCommands.push(command.getCommandBuilder());
						this.discordCommandMap.set(command.getCommandBuilder().name, command);
					}
				}

				const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
				await rest.put(Routes.applicationCommands(this.discord.application!.id), { body: discordCommands });
			});
		} else {
			logToConsole("warning", "No discord token in .env file, Not logging to discord!");
		}
	}

	public start = async () => {
		const commandPaths = ["stats", "fun", "skyblock", "misc"];
		for (const commandPathRaw of commandPaths) {
			const commandsPath = path.join(__dirname, "commands", commandPathRaw);
			const files = readdirSync(commandsPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));

			for (const file of files) {
				const resolvePath = path.join(commandsPath, file);
				const defaultImport = (await import(resolvePath)).default;
				const command = new defaultImport(this);
				this.commandMap.set(`${process.env?.BOT_PREFIX ?? "!"}${command.getName()}`, command);
			}
		}

		await this.startBot();
	};

	public startBot = () => {
		this.bot.once("spawn", () => {
			this.bot.addChatPattern("guild", /Guild > (.+)/, { parse: true, repeat: true });
			this.bot.addChatPattern("officer", /Officer > (.+)/, { parse: true, repeat: true });
		});

		this.bot.on("spawn", async () => {
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
				if (!this.isBotMuted) {
					const commandInstance = this.commandMap.get(commandName);
					if (commandInstance) {
						commandInstance.execute({ player, message, params });
					}
				} else {
					this.bot.chat(`/immuted ${sanatiseMessage(player).trim()}`);
				}
				return;
			}

			if (process.env.DISCORD_TOKEN && sanatiseMessage(player) != this.bot.username) {
				const playerUsername = sanatiseMessage(player).toLowerCase();
				const embed = new EmbedBuilder().setDescription(message);

				// Incase the bot was restarted when players are online, we can still add an avatar.
				if (!this.getPlayerCache().has(playerUsername)) {
					const { data, status } = await axios.get<PlayerDB>(`https://playerdb.co/api/player/minecraft/${playerUsername}`);
					if (status == 200) {
						this.getPlayerCache().set(playerUsername, { avatarUrl: data.data.player.avatar, uuid: data.data.player.raw_id, rank: null });
						try {
							const playerObject = await new SeraphCache().getPlayer(data.data.player.id);
							if (playerObject) this.getPlayerCache().set(playerUsername, { avatarUrl: data.data.player.avatar, uuid: data.data.player.raw_id, rank: getPlayerRank(playerObject) });
						} catch (e) {
							logToConsole("error", `Player couldn't be found. ${playerUsername}`);
						}
					}
				}

				// For type safety, We check to ensure it's defined even though it should be!
				const playerMapObject = this.getPlayerCache().get(playerUsername);
				if (playerMapObject) {
					embed.setAuthor({ iconURL: playerMapObject.avatarUrl, name: sanatiseMessage(player) }).setColor(`#${playerMapObject.rank?.colorHex}`);
				} else {
					embed.setColor("White").setAuthor({ name: sanatiseMessage(player) });
				}
				await this.sendToDiscord(embed);
			}
		});

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this.bot.on("chat:officer", async ([[msg]]) => {
			const player = msg.split(":")[0] as string;
			const message = msg.split(": ")[1] as string;
			const cleanPlayer = sanatiseMessage(player);

			const embed = new EmbedBuilder().setColor("White").setTitle(cleanPlayer).setDescription(message);
			const playerMapObject = this.getPlayerCache().get(cleanPlayer);
			if (playerMapObject) embed.setAuthor({ iconURL: playerMapObject.avatarUrl, name: cleanPlayer });
			await this.sendToDiscord(embed, { isAdmin: true });
		});

		this.bot.on("message", async (msg) => {
			const message = msg.toString();
			const ansiMessage = msg.toAnsi();

			if (!message.includes(":")) {
				// Hypixel Server messages, this is all we need xd
				logToConsole("chat", ansiMessage);
				this.formatDiscordMessage(message);
			}

			if (message.includes("invited you to join their guild")) {
				const guildJoinMessage = message.replaceAll("-", "").split("has invited you to join")[0];
				this.bot.chat(`/g accept ${sanatiseMessage(guildJoinMessage)}`);
			}
		});

		this.discord.on("messageCreate", async (message) => {
			const { bot, id } = message.author;
			if (message.channel.id == config.discord.loggingChannel && !bot && id != this.discord?.user?.id) {
				this.sendToHypixel(message);
			}
		});

		this.discord.on("interactionCreate", async (interaction) => {
			if (interaction.member && interaction.isCommand() && interaction.isChatInputCommand()) {
				interaction = interaction as ChatInputCommandInteraction;
				await interaction.deferReply({ fetchReply: true, ephemeral: true });
				const commandName = interaction.commandName;
				if (commandName && this.discordCommandMap.has(commandName)) {
					this.discordCommandMap.get(commandName)?.execute({ interaction, discordCommandMap: this.discordCommandMap });
				} else {
					await interaction.editReply(`This command doesn't appear to exist.`);
				}
			}
		});
	};

	public sendToDiscord = async (
		message: string | EmbedBuilder,
		options?: {
			isDiscord?: boolean;
			isAdmin?: boolean;
		},
	) => {
		const channel = options && options.isAdmin ? this.discord.channels.cache.get(config.discord.adminChannel ?? "") : this.discord.channels.cache.get(config.discord.loggingChannel ?? "");
		if (channel?.isTextBased()) {
			if (typeof message == "string") {
				const emoji = options && options.isDiscord ? config.emojis.discord : config.emojis.hypixel;
				await channel.send({ content: `${emoji} ${message}` });
			} else {
				await channel.send({ embeds: [message] });
			}
		}
	};

	private sendToHypixel = async (message: Message) => {
		if (!this.isBotMuted) {
			this.bot.chat(`${message.author.username}> ${message.content} `);
			await message.delete();
			const embed = new EmbedBuilder().setColor("Blurple").setTitle(message.author.username).setDescription(message.content);
			await this.sendToDiscord(embed, { isDiscord: true });
		} else {
			const discordEmbed = new EmbedBuilder().setDescription(`The bot has been muted.`).setColor("DarkRed").setTitle("Bot Muted");
			await this.sendToDiscord(discordEmbed, { isDiscord: true });
		}
	};

	private formatDiscordMessage = async (message: string) => {
		const cache = new SeraphCache();
		let splitMessage = sanatiseMessage(message, "{rank}").split(" ");
		// Remove's player rank, so the array only contains a name and message content.
		splitMessage = splitMessage.filter((rankString) => !rankString.includes("{rank}")).filter((emptyString) => emptyString !== "");

		// Remove name, so we can get the content of the message.
		const contentString = splitMessage.slice(1, splitMessage.length).join(" ").toLowerCase();
		const playerUsername = splitMessage[0]?.trim();
		const playerUsernameLower = playerUsername?.toLowerCase();
		const discordEmbed = new EmbedBuilder().setColor("Blurple");

		// check if the bot is muted
		const muteMatcher = message.match(/^Your mute will expire in (.+)/im);
		if (muteMatcher) {
			discordEmbed.setDescription(`The bot has been muted. Please stop trying to execute commands! The bot will be unmuted in ${muteMatcher[1]}`).setColor("DarkRed").setTitle("Bot Muted");
			this.sendToDiscord(discordEmbed);
			this.isBotMuted = true;
			return;
		}

		// A switch as it looks nicer than a ton of if-else statements.
		switch (contentString) {
			case "joined.":
				discordEmbed.setDescription(message).setColor("Green");
				if (!this.getPlayerCache().has(playerUsernameLower)) {
					const playerUuid = await cache.getPlayerByName(playerUsernameLower);
					if (playerUuid) {
						this.getPlayerCache().set(playerUsernameLower, { avatarUrl: `https://crafthead.net/avatar/${playerUuid}`, uuid: playerUuid, rank: null });
						try {
							const playerObject = await cache.getPlayer(playerUuid);
							if (playerObject) {
								this.getPlayerCache().set(playerUsernameLower, { avatarUrl: `https://crafthead.net/avatar/${playerUuid}`, uuid: playerUuid, rank: getPlayerRank(playerObject) });
							}
						} catch (e) {
							logToConsole("error", `Player not found. ${playerUsername}`);
						}
					}
				}
				await this.sendToDiscord(discordEmbed);
				await new Promise((_) => setTimeout(_, 1000));
				this.bot.chat(`${config.messages[Math.floor(Math.random() * config.messages.length)].replaceAll("%player%", playerUsername)}`);
				break;
			case "left.":
				discordEmbed.setDescription(message).setColor("Red");
				this.sendToDiscord(discordEmbed);
				break;
			case "joined the guild!":
				discordEmbed.setDescription(message).setColor("Green");
				this.sendToDiscord(discordEmbed);
				this.sendToDiscord(discordEmbed, { isAdmin: true });
				break;
			case "left the guild!":
				discordEmbed.setDescription(message).setColor("Red");
				this.sendToDiscord(discordEmbed);
				this.sendToDiscord(discordEmbed, { isAdmin: true });
				break;
			case "is not in your guild!":
				discordEmbed.setDescription(message).setColor("DarkRed");
				this.sendToDiscord(discordEmbed);
				break;
			case contentString.match(/^was kicked from the guild by (.+)!/)?.input:
				discordEmbed.setDescription(message).setColor("DarkRed");
				this.sendToDiscord(discordEmbed);
				this.sendToDiscord(discordEmbed, { isAdmin: true });
				break;
			case `has requested to join the guild!\nclick here to accept or type /guild accept ${playerUsername?.toLowerCase()}!\n-----------------------------------------------------\n`:
				discordEmbed.setDescription(message).setColor("Green");
				this.sendToDiscord(discordEmbed, { isAdmin: true });
				break;
			case "is already the highest rank you've created!----------------------------------------------------":
				discordEmbed.setDescription(message.replaceAll("-", "")).setColor("Yellow");
				this.sendToDiscord(discordEmbed, { isAdmin: true });
				break;
			case "is already the lowest rank you've created!----------------------------------------------------":
				discordEmbed.setDescription(message.replaceAll("-", "")).setColor("Yellow");
				this.sendToDiscord(discordEmbed, { isAdmin: true });
				break;
			case contentString.match(/^was promoted from (.+) to (.+)/i)?.input:
				discordEmbed.setDescription(message.replaceAll("-", "")).setColor("Green");
				this.sendToDiscord(discordEmbed);
				this.sendToDiscord(discordEmbed, { isAdmin: true });
				break;
			case contentString.match(/^was demoted from (.+) to (.+)/i)?.input:
				discordEmbed.setDescription(message.replaceAll("-", "")).setColor("DarkRed");
				this.sendToDiscord(discordEmbed);
				this.sendToDiscord(discordEmbed, { isAdmin: true });
				break;
			case "is already in another guild!":
				discordEmbed.setDescription(message).setColor("Yellow");
				this.sendToDiscord(discordEmbed, { isAdmin: true });
				break;
			case " is already in your guild!":
				discordEmbed.setDescription(message).setColor("Yellow");
				this.sendToDiscord(discordEmbed, { isAdmin: true });
				break;
			case "cannot invite this player to your guild!":
				discordEmbed.setDescription(message).setColor("DarkRed");
				this.sendToDiscord(discordEmbed, { isAdmin: true });
				break;
			case contentString.match(/^invited (.+) to your guild. they have 5 minutes to accept./)?.input:
				discordEmbed.setDescription(message).setColor("Green");
				this.sendToDiscord(discordEmbed, { isAdmin: true });
				break;
			case contentString.match(/^has muted (.+) for (.+)/)?.input:
				discordEmbed.setDescription(message).setColor("Green");
				this.sendToDiscord(discordEmbed);
				this.sendToDiscord(discordEmbed, { isAdmin: true });
				break;
			case contentString.match(/^has unmuted (.+)/)?.input:
				discordEmbed.setDescription(message).setColor("Green");
				this.sendToDiscord(discordEmbed);
				this.sendToDiscord(discordEmbed, { isAdmin: true });
				break;
			default:
				break;
		}
	};

	public getMineflayerInstance = () => this.bot;

	public getPlayerCache = () => this.playerCache;
}

new MinecraftBot().start();
