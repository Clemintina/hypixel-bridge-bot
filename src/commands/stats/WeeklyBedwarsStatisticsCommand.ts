import { CommandBase, CommandExecute } from "../../util/CommandHandler";
import { formatNumber, formatRatio, getPlayerUuid, sanatiseMessage, useHypixelApi } from "../../util/CommonUtils";
import { MinecraftBot } from "../../index";

class BedwarsStatisticsCommand extends CommandBase {
	constructor(minecraftBot: MinecraftBot) {
		super({ name: "weekly", description: "Shows a player's daily Bedwars stats", minecraftBot });
	}

	public execute = async ({ player, params }: CommandExecute) =>
		useHypixelApi(this.getBotInstance(), async (hypixelClient) => {
			const cleanPlayerName = sanatiseMessage(player).trim();
			let playerUuid;

			if (this.getBotInstance().getPlayerCache().has(player.toLowerCase()) && params.length == 0) {
				const cachedPlayer = this.getBotInstance().getPlayerCache().get(player.toLowerCase());
				if (cachedPlayer) playerUuid = cachedPlayer.uuid;
			} else {
				playerUuid = await getPlayerUuid(params.length == 0 ? cleanPlayerName : params[0].trim());
			}
			const playerStats = await hypixelClient.getPlayer(playerUuid);
			const cachedStats = await hypixelClient.getCachedPlayer(playerUuid, "weekly");

			if (playerStats && cachedStats) {
				const bedwars = playerStats.stats.Bedwars;
				const cachedBedwars = cachedStats.stats.Bedwars;
				if (bedwars && cachedBedwars) {
					const star = playerStats?.achievements?.bedwars_level ?? 0;
					const finalsDifference = (bedwars?.final_kills_bedwars ?? 0) - (cachedBedwars?.final_kills_bedwars ?? 0);
					const winsDifference = (bedwars?.wins_bedwars ?? 0) - (cachedBedwars?.wins_bedwars ?? 0);

					const fkdrDifference = formatRatio(finalsDifference, (bedwars?.final_deaths_bedwars ?? 0) - (cachedBedwars?.final_deaths_bedwars ?? 0));
					const bblrDifference = formatRatio((bedwars?.beds_broken_bedwars ?? 0) - (cachedBedwars?.beds_broken_bedwars ?? 0), (bedwars?.beds_lost_bedwars ?? 0) - (cachedBedwars?.beds_lost_bedwars ?? 0));
					const wlrDifference = formatRatio(winsDifference, (bedwars?.losses_bedwars ?? 0) - (cachedBedwars?.losses_bedwars ?? 0));

					const formattedString = `${star}\u272B FKDR: ${fkdrDifference} | BBLR: ${bblrDifference} | WLR: ${wlrDifference} | FK: ${formatNumber(finalsDifference)} | Wins: ${formatNumber(winsDifference)}`;

					this.send("bedwars", formattedString, playerStats);
				}
			} else {
				this.getBotInstance().getMineflayerInstance().chat(`The player ${cleanPlayerName} is invalid!`);
			}
		});
}

export default BedwarsStatisticsCommand;
