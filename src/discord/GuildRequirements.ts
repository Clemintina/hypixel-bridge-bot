import { ChatInputCommandInteraction, Client } from "discord.js";
import { ConfigFile } from "../util/CustomTypes";
import { SeraphCache } from "../util/SeraphCache";
import { formatRatio } from "../util/CommonUtils";

const GuildRequirements = async (client: Client, interaction: ChatInputCommandInteraction): Promise<void> => {
	if (interaction.commandName == "reqcheck") {
		const config = require("../../config.json5") as ConfigFile;

		let playerData: { uuid: string; name: string; gxpTotal: number;};
		const hypixelClient = new SeraphCache();

		const playername = interaction.options.getString("name") as string;
		const hypixelPlayer = await hypixelClient.getPlayer(playername);

		if (hypixelPlayer) {
			playerData = { uuid: hypixelPlayer.uuid, name: hypixelPlayer.displayname, gxpTotal: 0 };

			// Get Guild members
			const guild = await hypixelClient.getGuildById(config.guild.id);
			if (guild?.members) {
				for (const guildMember of guild.members) {
					if (guildMember.uuid == hypixelPlayer.uuid) {
						let gxpTotal = 0;
						Object.keys(guildMember.expHistory).map((gxp) => (gxpTotal += guildMember.expHistory[gxp]));
						playerData = { ...playerData, gxpTotal };
					}
				}

				const bedwars = hypixelPlayer?.stats?.Bedwars;
				const duels = hypixelPlayer?.stats?.Duels;

				const duelsWins = duels?.[`wins`] ? (duels[`wins`] as number) : 0;
				const duelsLosses = duels?.[`losses`] ? (duels[`losses`] as number) : 0;
				const duelsWLR = formatRatio(duelsWins, duelsLosses);

				const message = `Bedwars:\nLevel: ${hypixelPlayer?.achievements?.bedwars_level ?? 0}\n Wins: ${bedwars?.wins_bedwars ?? 0}\n\nDuels:\nWins: ${duelsWins}\nWLR: ${duelsWLR}`;

				await interaction.editReply(message);
			}
		}
	}
};

export default GuildRequirements;
