import { CommandBase, CommandExecution } from "../../util/SlashCommandHandler";
import { Client, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { MinecraftBot } from "../../index";

export default class GuildKickPlayer extends CommandBase {
	constructor(discordClient: Client<true>, botInstance: MinecraftBot) {
		super({
			discordClient,
			botInstance,
			commandBuilder: new SlashCommandBuilder()
				.setName("kick")
				.setDescription("Kicks a member from the guild")
				.addStringOption((options) => options.setName("player_name").setDescription("The name of the player you'd like to kick.").setRequired(true))
				.addStringOption((options) => options.setName("reason").setDescription("Reason to kick the player").setRequired(true))
				.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
		});
	}

	async execute({ interaction, discordCommandMap }: CommandExecution): Promise<void> {
		if (await this.hasPermissionToExecute({ interaction, discordCommandMap })) {
			this.getBotInstance()
				.getMineflayerInstance()
				.chat(`/g kick ${interaction.options.get("player_name")?.value} ${interaction.options.get("reason")?.value}`);
			await interaction.editReply("Command has been executed!");
		}
	}
}
