import { CommandBase, CommandExecute } from "../../util/CommandHandler";
import { formatNumber, formatRatio, sanatiseMessage, useHypixelApi } from "../../util/CommonUtils";
import { MinecraftBot } from "../../index";
import { getSkyWarsLevelInfo, getSkyWarsPrestigeForLevel } from "@zikeji/hypixel";

class DuelsStatisticsCommand extends CommandBase {
	constructor(minecraftBot: MinecraftBot) {
		super({ name: "sw", description: "Shows a player's Skywars stats", minecraftBot });
	}

	public execute = async ({ player, params }: CommandExecute) =>
		useHypixelApi(this.getBotInstance(), async (hypixelClient) => {
			const cleanPlayerName = sanatiseMessage(player).trim();
			const playerUuid = await this.getSeraphCache().getPlayerByName(params.length == 0 ? cleanPlayerName : params[0].trim());

			if (!playerUuid) {
				this.getBotInstance().getMineflayerInstance().chat(`Couldn't find a player by this name.`);
				return;
			}

			const playerStats = await hypixelClient.getPlayer(playerUuid);

			if (playerStats) {
				const skywars = playerStats.stats.SkyWars;
				if (skywars) {
					const kills = skywars.kills as number;
					const deaths = skywars.deaths as number;
					const kdr = formatRatio(kills, deaths);

					const wins = skywars.wins as number;
					const losses = skywars.losses as number;
					const wlr = formatRatio(wins, losses);

					const level = getSkyWarsLevelInfo(playerStats).level;
					const levelFormatted = `${level} ${getSkyWarsPrestigeForLevel(level).textIcon}`;

					const formattedString = `${levelFormatted} Kills: ${formatNumber(kills)} | Deaths: ${formatNumber(deaths)} | KDR: ${kdr} | Wins: ${formatNumber(wins)} | Losses: ${formatNumber(losses)} | WLR: ${wlr}`;

					this.send("skywars", formattedString, playerStats);
				} else {
					this.getBotInstance().getMineflayerInstance().chat(`This player has no Skywars stats!`);
				}
			} else {
				this.getBotInstance().getMineflayerInstance().chat(`The player ${cleanPlayerName} is invalid!`);
			}
		});
}

export default DuelsStatisticsCommand;
