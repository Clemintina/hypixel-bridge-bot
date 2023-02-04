import { ChatInputCommandInteraction, Client } from "discord.js";
import { Client as HypixelClient, Components } from "@zikeji/hypixel";
import { ConfigFile } from "../util/CustomTypes";
import { padNumber } from "../util/CommonUtils";

const GuildXpCommand = async (client: Client, interaction: ChatInputCommandInteraction, apiKey: string): Promise<void> => {
	if (interaction.commandName == "guildxp") {
		const config = require("../../config.json5") as ConfigFile;

		const playerData: Array<{ uuid: string; name: string; gxp: { [name: string]: number }; stats: Components.Schemas.Player }> = [];
		const hypixelClient = new HypixelClient(apiKey);
		// Get Guild members
		const guild = await hypixelClient.guild.id(config.guild.id);
		await new Promise((resolve) => setTimeout(resolve, 500));
		if (guild.members) {
			for (const guildMember of guild.members) {
				const playerResponse = await hypixelClient.player.uuid(guildMember.uuid);
				playerData.push({
					uuid: guildMember.uuid,
					name: playerResponse.displayname ?? "Error",
					gxp: guildMember.expHistory,
					stats: playerResponse,
				});
			}

			process.env.TZ = "America/Chicago";
			const currentDate = new Date();
			const hypixelDateFormat = `${currentDate.getFullYear()}-${padNumber(currentDate.getMonth() + 1)}-${padNumber(currentDate.getDate())}`;

			playerData.sort((playerA, playerB) => {
				const firstPlayer = Number(playerA.gxp[hypixelDateFormat]) ?? 0;
				const secondPlayer = Number(playerB.gxp[hypixelDateFormat]) ?? 0;
				return firstPlayer > secondPlayer ? 1 : -1;
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
				playerStats.push(`${messageColour} - ${player.name} - ${bedwarsWins} - ${player.gxp[hypixelDateFormat]}`);
			}

			const fullMessage = playerStats.join("\n");
			const guildMemberChunkMessage = chunkSubstr(fullMessage, 1990);

			for ( const guildMemberChunk of guildMemberChunkMessage ) {
				if (interaction.channel) {
					await interaction.channel.send(guildMemberChunk);
				}
			}
			await interaction.editReply('Fetched the guild.')
		}
	}
};

// Splits the message into multiple chunks
// https://stackoverflow.com/a/29202760
const chunkSubstr = ( str: string, size:number) => {
	const numChunks = Math.ceil(str.length / size)
	const chunks = new Array<string>(numChunks)

	for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
		chunks[i] = str.substring(o, size)
	}

	return chunks
};

export default GuildXpCommand;
