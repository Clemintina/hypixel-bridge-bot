import { BotOptions, createBot } from "mineflayer";
import { SocksClient } from "socks";
import { Client as Discord, EmbedBuilder, IntentsBitField, Message, REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import path from "path";
import { readdirSync } from "fs";
import { CommandBase } from "./util/CommandHandler";
import { sanatiseMessage } from "./util/CommonUtils";

import "json5/lib/register";
import axios from "axios";
import { PlayerDB, PlayerMapObject } from "./util/CustomTypes";
import { Client, getPlayerRank } from "@zikeji/hypixel";

const config = require("../config.json5");

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

export class MinecraftBot {
	private readonly bot;
	private discord = new Discord({
		intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent],
	});
	private key = "";
	private commandMap: Map<string, CommandBase> = new Map();
	private playerCache: Map<string, PlayerMapObject> = new Map<string, PlayerMapObject>();

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
		this.bot.addChatPattern("officer", /Officer > (.+)/, { parse: true, repeat: true });

		if (process.env.DISCORD_TOKEN) {
			console.log("Logging in to Discord");
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
				new SlashCommandBuilder()
					.setName("accept")
					.setDescription("Accepts a player into the guild")
					.addStringOption((option) => {
						option.setName("player_name").setDescription(`The username of the player you'd like to accept into the guild`).setRequired(true);
						return option;
					}),
				new SlashCommandBuilder()
					.setName("promote")
					.setDescription("Promotes a player in the guild")
					.addStringOption((option) => {
						option.setName("player_name").setDescription(`The username of the player you'd like to promote`).setRequired(true);
						return option;
					}),
				new SlashCommandBuilder()
					.setName("demote")
					.setDescription("Demotes a player in the guild")
					.addStringOption((option) => {
						option.setName("player_name").setDescription(`The username of the player you'd like to demote`).setRequired(true);
						return option;
					}),
				new SlashCommandBuilder()
					.setName("invite")
					.setDescription("Invites a player to the guild")
					.addStringOption((option) => {
						option.setName("player_name").setDescription(`The username of the player you'd like to invite`).setRequired(true);
						return option;
					}),
				new SlashCommandBuilder()
					.setName("mute")
					.setDescription("Mutes a player in the guild")
					.addStringOption((options) => {
						options.setName("player_name").setDescription("The name of the player to mute.").setRequired(true);
						return options;
					})
					.addStringOption((options) => {
						options.setName("time_period").setDescription("Time period to mute").setRequired(true);
						return options;
					}),
				new SlashCommandBuilder()
					.setName("unmute")
					.setDescription("Unmutes a player in the guild")
					.addStringOption((option) => {
						option.setName("player_name").setDescription(`The username of the player you'd like to unmute`).setRequired(true);
						return option;
					}),
			];
			rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, process.env.DISCORD_GUILD_ID!), { body: commands }).then(() => console.log("PUT discord commands"));
		} else {
			console.log("No discord token in .env file, Not logging to discord!");
		}
	}

	public start = async () => {
		const commandPaths = ["stats", "fun"];
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
							const playerObject = await new Client(this.key).player.uuid(data.data.player.id);
							this.getPlayerCache().set(playerUsername, { avatarUrl: data.data.player.avatar, uuid: data.data.player.raw_id, rank: getPlayerRank(playerObject) });
						} catch (e) {
							console.log(e);
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
				console.log(ansiMessage);
				this.formatDiscordMessage(message);
			}

			if (message.includes("invited you to join their guild")) {
				const guildJoinMessage = message.replaceAll("-", "").split("has invited you to join")[0];
				this.bot.chat(`/g accept ${sanatiseMessage(guildJoinMessage)}`);
			}

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
						await interaction.deferReply({ fetchReply: true, ephemeral: true });
						if (interaction.commandName == "kick") {
							await this.bot.chat(`/g kick ${interaction.options.get("player_name")?.value} ${interaction.options.get("reason")?.value}`);
							await interaction.editReply("Command has been executed!");
						} else if (interaction.commandName == "accept") {
							await this.bot.chat(`/g accept ${interaction.options.get("player_name")?.value}`);
							await interaction.editReply("Command has been executed!");
						} else if (interaction.commandName == "promote") {
							await this.bot.chat(`/g promote ${interaction.options.get("player_name")?.value}`);
							await interaction.editReply("Command has been executed!");
						} else if (interaction.commandName == "demote") {
							await this.bot.chat(`/g demote ${interaction.options.get("player_name")?.value}`);
							await interaction.editReply("Command has been executed!");
						} else if (interaction.commandName == "invite") {
							await this.bot.chat(`/g invite ${interaction.options.get("player_name")?.value}`);
							await interaction.editReply("Command has been executed!");
						} else if (interaction.commandName == "mute") {
							await this.bot.chat(`/g mute ${interaction.options.get("player_name")?.value} ${interaction.options.get("time_period")?.value}`);
							await interaction.editReply("Command has been executed!");
						} else if (interaction.commandName == "unmute") {
							await this.bot.chat(`/g unmute ${interaction.options.get("player_name")?.value}`);
							await interaction.editReply("Command has been executed!");
						}
					} else {
						await interaction.reply(`You don't have the required permissions to execute this command!`);
					}
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
		const channel = options && options.isAdmin ? await this.discord.channels.cache.get(process.env.DISCORD_ADMIN_CHANNEL_ID ?? "") : await this.discord.channels.cache.get(process.env.DISCORD_LOGGING_CHANNEL ?? "");
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
		this.bot.chat(`${message.author.username}> ${message.content} `);
		await message.delete();
		const embed = new EmbedBuilder().setColor("Blurple").setTitle(message.author.username).setDescription(message.content);
		this.sendToDiscord(embed, { isDiscord: true });
	};

	private formatDiscordMessage = async (message: string) => {
		let splitMessage = sanatiseMessage(message, "{rank}").split(" ");
		// Remove's player rank, so the array only contains a name and message content.
		splitMessage = splitMessage.filter((rankString) => !rankString.includes("{rank}")).filter((emptyString) => emptyString !== "");

		// Remove name, so we can get the content of the message.
		const contentString = splitMessage.slice(1, splitMessage.length).join(" ").toLowerCase();
		const playerUsername = splitMessage[0]?.trim();
		const playerUsernameLower = playerUsername?.toLowerCase();
		const discordEmbed = new EmbedBuilder().setColor("Blurple");

		// A switch as it looks nicer than a ton of if-else statements.
		switch (contentString) {
			case "joined.":
				discordEmbed.setDescription(message).setColor("Green");
				if (!this.getPlayerCache().has(playerUsernameLower)) {
					const { data, status } = await axios.get<PlayerDB>(`https://playerdb.co/api/player/minecraft/${playerUsernameLower}`);
					if (status == 200) {
						this.getPlayerCache().set(playerUsernameLower, { avatarUrl: data.data.player.avatar, uuid: data.data.player.raw_id, rank: null });
						try {
							const playerObject = await new Client(this.key).player.uuid(data.data.player.id);
							this.getPlayerCache().set(playerUsernameLower, { avatarUrl: data.data.player.avatar, uuid: data.data.player.raw_id, rank: getPlayerRank(playerObject) });
						} catch (e) {
							console.log(e);
						}
					}
				}
				this.sendToDiscord(discordEmbed);
				break;
			case "left.":
				discordEmbed.setDescription(message).setColor("Red");
				this.sendToDiscord(discordEmbed);
				break;
			case "joined the guild!":
				discordEmbed.setDescription(message).setColor("Green");
				this.sendToDiscord(discordEmbed);
				break;
			case "left the guild!":
				discordEmbed.setDescription(message).setColor("Red");
				this.sendToDiscord(discordEmbed);
				break;
			case "is not in your guild!":
				discordEmbed.setDescription(message).setColor("DarkRed");
				this.sendToDiscord(discordEmbed);
				break;
			case contentString.match(/^was kicked from the guild by (.+)!/)?.input:
				discordEmbed.setDescription(message).setColor("DarkRed");
				this.sendToDiscord(discordEmbed);
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
				break;
			case contentString.match(/^was demoted from (.+) to (.+)/i)?.input:
				discordEmbed.setDescription(message.replaceAll("-", "")).setColor("DarkRed");
				this.sendToDiscord(discordEmbed);
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
				break;
			case contentString.match(/^has unmuted (.+)/)?.input:
				discordEmbed.setDescription(message).setColor("Green");
				this.sendToDiscord(discordEmbed);
				break;
			default:
				break;
		}
	};

	public getMineflayerInstance = () => this.bot;

	public getPlayerCache = () => this.playerCache;
}

new MinecraftBot().start();
