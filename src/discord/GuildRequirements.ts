import { ChatInputCommandInteraction, Client, EmbedBuilder } from "discord.js";
import { ConfigFile } from "../util/CustomTypes";
import { SeraphCache } from "../util/SeraphCache";
import { formatRatio } from "../util/CommonUtils";
import { Color } from "chalk";

const GuildRequirements = async (client: Client, interaction: ChatInputCommandInteraction): Promise<void> => {
	if (interaction.commandName == "reqcheck") {
		const config = require("../../config.json5") as ConfigFile;

		let playerData: { uuid: string; name: string; gxpTotal: number };
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
			}

			const bedwars = hypixelPlayer?.stats?.Bedwars;
			const duels = hypixelPlayer?.stats?.Duels;

			const duelsWins = duels?.[`wins`] ? (duels[`wins`] as number) : 0;
			const duelsLosses = duels?.[`losses`] ? (duels[`losses`] as number) : 0;
			const duelsWLR = formatRatio(duelsWins, duelsLosses);

			const playerEmbed = new EmbedBuilder().setTimestamp(Date.now()).setTitle(hypixelPlayer.displayname);

			playerEmbed.addFields(
				{
					name: "Bedwars",
					value: `Level: ${hypixelPlayer?.achievements?.bedwars_level ?? 0}\nWins: ${bedwars?.wins_bedwars ?? 0}`,
				},
				{
					name: "Duels",
					value: `Wins: ${duelsWins}\nWLR: ${duelsWLR}`,
				},
			);

			const requirements = config.guild.requirements;
			if (requirements.bedwars_wins < (hypixelPlayer?.stats?.Bedwars?.wins_bedwars ?? 0) || requirements.duels_wins < duelsWins) {
				playerEmbed.setColor("Green");
			} else {
				playerEmbed.setColor("Red");
			}

			await interaction.editReply({ embeds: [playerEmbed] });
		} else {
			await interaction.editReply("This name is either invalid or doesn't exist on Hypixel, Try again in a minute or use their UUID.");
		}
	}
};

export default GuildRequirements;
