import { CommandBase, CommandExecute } from "../../util/CommandHandler";
import { MinecraftBot } from "../../index";
import { formatRatio, sanatiseMessage, useHypixelApi } from "../../util/CommonUtils";

class GuildRequirementCheck extends CommandBase {
	constructor(minecraftBot: MinecraftBot) {
		super({ name: "checkreq", description: "Checks if a player meets the requirements..", minecraftBot });
	}

	public execute = async ({ params }: CommandExecute) =>
		useHypixelApi(this.getBotInstance(), async (hypixelClient) => {
			if (params.length != 1) {
				this.getBotInstance().getMineflayerInstance().chat("Please enter a name.");
				return;
			}
			const cleanPlayerName = sanatiseMessage(params[0]).trim();
			const playerStats = await hypixelClient.getPlayer(cleanPlayerName);

			if (playerStats) {
				let bedwarsRequirement = false,
					duelsRequirement = false;

				const bedwars = playerStats?.stats?.Bedwars;
				if (bedwars) {
					const wins = bedwars?.wins_bedwars ?? 0;
					const fkdr = formatRatio(bedwars?.final_kills_bedwars ?? 0, bedwars?.final_deaths_bedwars ?? 0);
					bedwarsRequirement = wins > 4000 && Math.floor(Number(fkdr)) > 4;
				}

				const duels = playerStats?.stats?.Duels;
				if (duels) {
					const wins = duels["wins"] ? (duels["wins"] as number) : 0;
					const losses = duels["losses"] ? (duels["losses"] as number) : 0;
					const wlr = formatRatio(wins, losses);

					duelsRequirement = wins > 6000 && Math.round(Number(wlr)) > 2.5;
				}

				const formattedString = `Bedwars: ${bedwarsRequirement ? "Y" : "N"} | Duels: ${duelsRequirement ? "Y" : "N"}`;
				this.send("NONE", formattedString, playerStats);
			} else {
				this.getBotInstance().getMineflayerInstance().chat(`The player ${cleanPlayerName} is invalid!`);
			}
		});
}

export default GuildRequirementCheck;
