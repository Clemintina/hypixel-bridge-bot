import { CommandBase, CommandExecute } from "../../util/CommandHandler";
import { MinecraftBot } from "../../index";
import { getPlayerUuid, sanatiseMessage, useHypixelApi } from "../../util/CommonUtils";
import { EmbedBuilder } from "discord.js";

class SkyblockNetworthCommand extends CommandBase {
	constructor(minecraftBot: MinecraftBot) {
		super({ name: "nw", description: "Gets a player's networth (if enabled)", minecraftBot });
	}

	public execute = async ({ player, params }: CommandExecute) =>
		useHypixelApi(this.getBotInstance(), async (hypixelClient) => {
			const cleanPlayerName = sanatiseMessage(player).trim();
			let playerUuid;
			if (this.getBotInstance().getPlayerCache().has(player.toLowerCase()) && params.length == 0) {
				const cachedPlayer = this.getBotInstance().getPlayerCache().get(player.toLowerCase());
				if (cachedPlayer) playerUuid = cachedPlayer.uuid;
			} else {
				playerUuid = await getPlayerUuid(params.length == 0 ? cleanPlayerName : params[0].trim());
			}

			const selectedPlayerName = params.length == 0 ? cleanPlayerName : params[0].trim();
			const profile = await hypixelClient.getSkyblockProfile(playerUuid);

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const profileData = profile.filter((profile) => profile?.selected)[0];

			if (profileData) {
				const bankBalance = profileData?.banking?.balance ?? 0;
				const { getNetworth } = require("skyhelper-networth");
				const playerNetworth = await getNetworth(profileData.members[playerUuid], bankBalance);
				const formattedString = `$${ playerNetworth }`;

				this.getBotInstance().getMineflayerInstance().chat(formattedString);
				const embed = new EmbedBuilder().setTitle(`The networth of ${ selectedPlayerName }`).setDescription(`${ selectedPlayerName }'s networth: ${ formattedString }`).setColor("DarkGold").setThumbnail(`https://crafthead.net/avatar/${ playerUuid }`);
				this.getBotInstance().sendToDiscord(embed);
			} else {
				this.getBotInstance().getMineflayerInstance().chat(`Couldn't find an active profile by this name.`);
			}
		});
}

export default SkyblockNetworthCommand;
