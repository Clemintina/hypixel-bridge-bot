import { CommandBase, CommandExecute } from "../util/CommandHandler";
import { formatRatio, getPlayerUuid, sanatiseMessage, useHypixelApi } from "../util/CommonUtils";
import { getPlayerRank } from "@zikeji/hypixel";
import { Bot } from "mineflayer";

class BedwarsStatisticsCommand extends CommandBase {
	constructor(minecraftBot: Bot) {
		super({ name: "bw", description: "Shows a player's Bedwars stats", minecraftBot });
	}

	public execute = async ({ player, params }: CommandExecute) =>
		useHypixelApi(this.getBotInstance(), async (hypixelClient) => {
			const cleanPlayerName = sanatiseMessage(player).trim();

			const playerUuid = await getPlayerUuid(params.length == 0 ? cleanPlayerName : params[0].trim());
			const playerStats = await hypixelClient.player.uuid(playerUuid);

			if (playerStats) {
				const bedwars = playerStats.stats.Bedwars;
				const star = playerStats?.achievements?.bedwars_level ?? 0;
				const fkdr = formatRatio(bedwars?.final_kills_bedwars ?? 0, bedwars?.final_deaths_bedwars ?? 0);
				const bblr = formatRatio(bedwars?.beds_broken_bedwars ?? 0, bedwars?.beds_lost_bedwars ?? 0);
				const wlr = formatRatio(bedwars?.wins_bedwars ?? 0, bedwars?.losses_bedwars ?? 0);
				const finals = bedwars?.final_kills_bedwars;
				this.getBotInstance().chat(`/gc ${star} ${getPlayerRank(playerStats).cleanPrefix} ${playerStats.displayname} FKDR: ${fkdr} BBLR: ${bblr} WLR: ${wlr} FK: ${finals}`);
			} else {
				this.getBotInstance().chat(`/gc The player ${cleanPlayerName} is invalid!`);
			}
		});
}

export default BedwarsStatisticsCommand;
