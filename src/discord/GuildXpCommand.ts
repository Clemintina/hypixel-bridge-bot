import { ChatInputCommandInteraction, Client } from "discord.js";
import { Components } from "@zikeji/hypixel";
import { ConfigFile } from "../util/CustomTypes";
import { SeraphCache } from "../util/SeraphCache";

const GuildXpCommand = async (client: Client, interaction: ChatInputCommandInteraction): Promise<void> => {
	if (interaction.commandName == "guildxp") {
		const config = require("../../config.json5") as ConfigFile;

		const playerData: Array<{ uuid: string; name: string; gxp: { [name: string]: number }; gxpTotal: number; stats: Components.Schemas.Player }> = [];
		const hypixelClient = new SeraphCache();
		// Get Guild members
		const guild = await hypixelClient.getGuildById(config.guild.id);
		if (guild?.members) {
			for (const guildMember of guild.members) {
				const playerResponse = await hypixelClient.getPlayer(guildMember.uuid);
				if (playerResponse) {
					let gxpTotal = 0;
					Object.keys(guildMember.expHistory).map((gxp) => (gxpTotal += guildMember.expHistory[gxp]));

					playerData.push({
						uuid: guildMember.uuid,
						name: playerResponse.displayname ?? "Error",
						gxp: guildMember.expHistory,
						gxpTotal,
						stats: playerResponse,
					});
				}
			}

			playerData.sort((playerA, playerB) => {
				const firstPlayer = playerA.gxpTotal;
				const secondPlayer = playerB.gxpTotal;
				return firstPlayer > secondPlayer ? -1 : 1;
			});

			const playerStats: Array<string> = [];
			for (const player of playerData) {
				const bedwarsWins = player.stats?.stats?.Bedwars?.wins_bedwars ?? 0;
				let messageColour: ":green_circle:" | ":yellow_circle:" | ":red_circle:";
				if (bedwarsWins > config.guild.requirements.bedwars_wins) {
					messageColour = ":green_circle:";
				} else if (bedwarsWins > config.guild.requirements.bedwars_wins - 500) {
					messageColour = ":yellow_circle:";
				} else {
					messageColour = ":red_circle:";
				}
				playerStats.push(`${messageColour} ${player.name} | Wins: ${bedwarsWins} | Weekly GXP: ${player.gxpTotal}`);
			}

			const fullMessage = playerStats.join("\n");
			const guildMemberChunkMessage = chunkSubstr(fullMessage, 1990);

			for (const guildMemberChunk of guildMemberChunkMessage) {
				if (interaction.channel && guildMemberChunk.length > 0) {
					await interaction.channel.send(guildMemberChunk);
				}
			}
			await interaction.editReply("Fetched the guild.");
		}
	}
};

// Splits the message into multiple chunks
// https://stackoverflow.com/a/63716019
const chunkSubstr = (str: string, size: number) => {
	const length = str.length;
	const chunks = Array(Math.ceil(length / size));
	for (let i = 0, index = 0; index < length; i++) {
		chunks[i] = str.slice(index, (index += size));
	}
	return chunks;
};

export default GuildXpCommand;
