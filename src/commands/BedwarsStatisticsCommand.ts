import { CommandBase, CommandExecute } from "../util/CommandHandler";
import { formatNumber, formatRatio, getPlayerUuid, sanatiseMessage, useHypixelApi } from "../util/CommonUtils";
import { MinecraftBot } from "../index";

class BedwarsStatisticsCommand extends CommandBase {
	constructor(minecraftBot: MinecraftBot) {
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
				const finals = bedwars?.final_kills_bedwars ?? 0;
				const wins = bedwars?.wins_bedwars ?? 0;

				const fkdr = formatRatio(finals, bedwars?.final_deaths_bedwars ?? 0);
				const bblr = formatRatio(bedwars?.beds_broken_bedwars ?? 0, bedwars?.beds_lost_bedwars ?? 0);
				const wlr = formatRatio(wins, bedwars?.losses_bedwars ?? 0);

				const formattedString = `${star}\u272B FKDR: ${fkdr} | BBLR: ${bblr} | WLR: ${wlr} | FK: ${formatNumber(finals)} | Wins: ${formatNumber(wins)}`;

				this.send("Bedwars", formattedString, playerStats);
			} else {
				this.getBotInstance().getMineflayerInstance().chat(`The player ${cleanPlayerName} is invalid!`);
			}
		});
}

export default BedwarsStatisticsCommand;
