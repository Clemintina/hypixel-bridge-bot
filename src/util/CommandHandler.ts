import { MinecraftBot } from "../index";
import { EmbedBuilder, HexColorString } from "discord.js";
import { Components, getPlayerRank } from "@zikeji/hypixel";
import Player = Components.Schemas.Player;
import { SeraphCache } from "./SeraphCache";

type CommandRegister = {
	name: string;
	description: string;
	minecraftBot: MinecraftBot;
};

export type CommandExecute = {
	player: string;
	message: string;
	params: Array<string>;
};

export abstract class CommandBase {
	private readonly name;
	private readonly description;
	private readonly minecraftInstance: MinecraftBot;
	private readonly seraphCache;

	protected constructor({ name, description, minecraftBot }: CommandRegister) {
		this.name = name;
		this.description = description;
		this.minecraftInstance = minecraftBot;
		this.seraphCache = new SeraphCache();
	}

	protected getName = () => this.name;

	protected getDescription = () => this.description;

	protected getBotInstance = () => this.minecraftInstance;

	protected getSeraphCache = () => this.seraphCache;

	abstract execute({ player, message, params }: CommandExecute): void;

	protected send = (gamemode: "bedwars" | "skywars" | "duels" | "NONE", formattedString: string, playerStats: Player) => {
		const playerRank = getPlayerRank(playerStats);
		const formattedRank = `${playerRank.cleanPrefix} ${playerStats.displayname.replaceAll("_", "\\_")}`;
		const playerRankColour: HexColorString = `#${playerRank.colorHex}`;

		this.getBotInstance().getMineflayerInstance().chat(formattedString);
		if (gamemode != "NONE") {
			const embed = new EmbedBuilder()
				.setTitle(formattedRank)
				.setDescription(`${gamemode.charAt(0).toUpperCase() + gamemode.slice(1)} statistics for: ${formattedRank} | ${formattedString}`)
				.setColor(playerRankColour)
				.setThumbnail(`https://crafthead.net/avatar/${playerStats.uuid}`);
			this.getBotInstance().sendToDiscord(embed);
		} else {
			const embed = new EmbedBuilder().setTitle(formattedRank).setDescription(formattedString).setColor(playerRankColour).setThumbnail(`https://crafthead.net/avatar/${playerStats.uuid}`);
			this.getBotInstance().sendToDiscord(embed);
		}
	};
}
