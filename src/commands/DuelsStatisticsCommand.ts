import { CommandBase, CommandExecute } from "../util/CommandHandler";
import { formatNumber, formatRatio, getPlayerUuid, sanatiseMessage, useHypixelApi } from "../util/CommonUtils";
import { MinecraftBot } from "../index";

class DuelsStatisticsCommand extends CommandBase {
	constructor(minecraftBot: MinecraftBot) {
		super({ name: "duels", description: "Shows a player's Duels stats", minecraftBot });
	}

	public execute = async ({ player, params }: CommandExecute) =>
		useHypixelApi(this.getBotInstance(), async (hypixelClient) => {
			const cleanPlayerName = sanatiseMessage(player).trim();

			const playerUuid = await getPlayerUuid(params.length == 0 ? cleanPlayerName : params[0].trim());
			const playerStats = await hypixelClient.player.uuid(playerUuid);
			const duels_mode = params.length >= 2 ? `${params[1]}_duel_` : "";

			if (playerStats) {
				const duels = playerStats.stats.Duels;
				if (duels) {
					const kills = duels[`${duels_mode}kills`] ? (duels[`${duels_mode}kills`] as number) : 0;
					const deaths = duels[`${duels_mode}deaths`] ? (duels[`${duels_mode}deaths`] as number) : 0;
					const kdr = formatRatio(kills, deaths);

					const wins = duels[`${duels_mode}wins`] ? (duels[`${duels_mode}wins`] as number) : 0;
					const losses = duels[`${duels_mode}losses`] ? (duels[`${duels_mode}losses`] as number) : 0;
					const wlr = formatRatio(wins, losses);

					const formattedString = `Kills: ${formatNumber(kills)} | Deaths: ${formatNumber(deaths)} | KDR: ${kdr} |  Wins: ${formatNumber(wins)} | Losses: ${formatNumber(losses)} | WLR: ${wlr}`;

					this.send("Duels", formattedString, playerStats);
				} else {
					this.getBotInstance().getMineflayerInstance().chat(`This player has no Duels stats!`);
				}
			} else {
				this.getBotInstance().getMineflayerInstance().chat(`The player ${cleanPlayerName} is invalid!`);
			}
		});
}

export default DuelsStatisticsCommand;
