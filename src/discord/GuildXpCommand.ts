import { ChatInputCommandInteraction, Client } from "discord.js";
import { Client as HypixelClient, Components } from "@zikeji/hypixel";
import { ConfigFile } from "../util/CustomTypes";
import { padNumber } from "../util/CommonUtils";

const GuildXpCommand = async (client: Client, interaction: ChatInputCommandInteraction, playerUuid: string, apiKey: string): Promise<void> => {
	if (interaction.commandName == "guildxp") {
		const config = require("../../config.json5") as ConfigFile;

		const playerData: Array<{ uuid: string; name: string; gxp: { [name: string]: number }; stats: Components.Schemas.Player }> = [];
		const hypixelClient = new HypixelClient(apiKey);
		// Get Guild members
		const guild = await hypixelClient.guild.player(playerUuid);
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
				playerStats.push(`${messageColour} - ${player.name} - ${player.gxp[hypixelDateFormat]}`);
			}

			const fullMessage = playerStats.join("\n");
			if (fullMessage.length > 1995) {
				const splitMessageOne = fullMessage.substring(0, 1995);
				const splitMessageTwo = fullMessage.substring(1996, fullMessage.length);
				if (interaction.channel) {
					await interaction.channel.send(splitMessageOne);
					await interaction.channel.send(splitMessageTwo);
				}
				await interaction.editReply(`Fetched Guild!`);
			} else {
				await interaction.editReply(fullMessage);
			}
		}
	}
};

export default GuildXpCommand;
