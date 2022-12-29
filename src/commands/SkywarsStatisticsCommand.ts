import { CommandBase, CommandExecute } from "../util/CommandHandler";
import { formatRatio, getPlayerUuid, sanatiseMessage, useHypixelApi } from "../util/CommonUtils";
import { MinecraftBot } from "../index";

class DuelsStatisticsCommand extends CommandBase {
    constructor(minecraftBot: MinecraftBot) {
        super({ name: "sw", description: "Shows a player's Skywars stats", minecraftBot });
    }

    public execute = async ({ player, params }: CommandExecute) =>
        useHypixelApi(this.getBotInstance(), async (hypixelClient) => {
            const cleanPlayerName = sanatiseMessage(player).trim();

            const playerUuid = await getPlayerUuid(params.length == 0 ? cleanPlayerName : params[0].trim());
            const playerStats = await hypixelClient.player.uuid(playerUuid);

            if (playerStats) {
                // TODO type skywars object
                const skywars = playerStats.stats.SkyWars;
                if (skywars) {
                    const kills = 0;
                    const deaths = 0;
                    const kdr = formatRatio(kills, deaths);

                    const formattedString = `Kills: ${kills} | Deaths: ${deaths} | KDR: ${kdr} `;

                    this.send("Skywars", formattedString, playerStats);
                } else {
                    this.getBotInstance().getMineflayerInstance().chat(`This player has no Skywars stats!`);
                }
            } else {
                this.getBotInstance().getMineflayerInstance().chat(`The player ${cleanPlayerName} is invalid!`);
            }
        });
}

export default DuelsStatisticsCommand;
