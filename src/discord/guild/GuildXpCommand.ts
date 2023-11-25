import { Client, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { config, MinecraftBot } from "../../index";
import { CommandBase, CommandExecution } from "../../util/SlashCommandHandler";
import { Components } from "@zikeji/hypixel";
import { SeraphCache } from "../../util/SeraphCache";

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

export default class GuildXpCommand extends CommandBase {
	constructor(discordClient: Client<true>, botInstance: MinecraftBot) {
		super({
			discordClient,
			botInstance,
			commandBuilder: new SlashCommandBuilder().setName("viewxp").setDescription("Display guild member xp").setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
		});
	}

	async execute({ interaction }: CommandExecution) {
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
					continue;
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
}
