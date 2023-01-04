import { MinecraftBot } from "../index";
import { ColorResolvable, EmbedBuilder } from "discord.js";
import { Components, getPlayerRank, MinecraftFormatting } from "@zikeji/hypixel";
import Player = Components.Schemas.Player;

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
	private readonly minecraftInstance;

	protected constructor ({ name, description, minecraftBot }: CommandRegister) {
		this.name = name;
		this.description = description;
		this.minecraftInstance = minecraftBot;
	}

	protected getName = () => {
		return this.name;
	};

	protected getDescription = () => {
		return this.description;
	};

	protected getBotInstance = () => {
		return this.minecraftInstance;
	};

	abstract execute ({ player, message, params }: CommandExecute): void;

	protected send = (gamemode: string, formattedString: string, playerStats: Player) => {
		const playerRank = getPlayerRank(playerStats);
		const formattedRank = `${ playerRank.cleanPrefix } ${ playerStats.displayname.replaceAll("_", "\\_") }`;
		let playerRankColour: ColorResolvable;

		switch (playerRank.colorCode) {
			case MinecraftFormatting.GREEN:
				playerRankColour = "Green";
				break;
			case MinecraftFormatting.AQUA:
				playerRankColour = "Aqua";
				break;
			case MinecraftFormatting.GOLD:
				playerRankColour = "Gold";
				break;
			case MinecraftFormatting.GRAY:
				playerRankColour = "Grey";
				break;
			case MinecraftFormatting.DARK_GREEN:
				playerRankColour = "DarkGreen";
				break;
			default:
				playerRankColour = "Red";
				break;
		}

		this.getBotInstance().getMineflayerInstance().chat(formattedString);
		const embed = new EmbedBuilder().setTitle(formattedRank).setDescription(`${ gamemode } statistics for: ${ formattedRank } | ${ formattedString }`).setColor(playerRankColour);
		this.getBotInstance().sendToDiscord(embed);
	};
}
