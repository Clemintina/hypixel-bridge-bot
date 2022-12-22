import { CommandBase, CommandExecute } from "../util/CommandHandler";
import { formatRatio, getPlayerUuid, sanatiseMessage } from "../util/CommonUtils";
import { Client, getPlayerRank } from "@zikeji/hypixel";
import { getAppConfig } from "../index";
import { Bot } from "mineflayer";

class BedwarsStatisticsCommand extends CommandBase {
    constructor(minecraftBot: Bot) {
        super({ name: "bw", description: "Shows a player's Bedwars stats", minecraftBot });
    }

    public execute = async ({ player, message, params }: CommandExecute) => {
        try {
            const hypixelClient = new Client(getAppConfig().hypixelApiKey);
            const cleanPlayerName = sanatiseMessage(player).trim();
            if (params.length == 0) {
                const playerUuid = await getPlayerUuid(cleanPlayerName);
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
            } else {
                const cleanParamPlayerName = params[0].trim();
                const playerUuid = await getPlayerUuid(cleanParamPlayerName);
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
            }
        } catch (e) {
            console.log(e);
        }
    };
}

export default BedwarsStatisticsCommand;
