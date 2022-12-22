import { CommandBase, CommandExecute } from "../util/CommandHandler";
import { formatRatio, getPlayerUuid, sanatiseMessage, useHypixelApi } from "../util/CommonUtils";
import { getPlayerRank } from "@zikeji/hypixel";
import { Bot } from "mineflayer";

class DuelsStatisticsCommand extends CommandBase {
    constructor(minecraftBot: Bot) {
        super({ name: "duels", description: "Shows a player's Duels stats", minecraftBot });
    }

    public execute = async ({ player, message, params }: CommandExecute) => {
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
                    this.getBotInstance().chat(`${getPlayerRank(playerStats).cleanPrefix} ${playerStats.displayname} KDR: ${kdr} Kills: ${kills} Deaths: ${deaths}`);
                } else {
                    this.getBotInstance().chat(`This player has no Duels stats!`);
                }
            } else {
                this.getBotInstance().chat(`The player ${cleanPlayerName} is invalid!`);
            }
        });
    };
}

export default DuelsStatisticsCommand;
