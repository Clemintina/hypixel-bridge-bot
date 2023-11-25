import { CommandBase, CommandExecution } from "../../util/SlashCommandHandler";
import { Client, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { MinecraftBot } from "../../index";

export default class GuildMuteMember extends CommandBase {
	constructor(discordClient: Client<true>, botInstance: MinecraftBot) {
		super({
			discordClient,
			botInstance,
			commandBuilder: new SlashCommandBuilder()
				.setName("mute")
				.setDescription("Mutes a member in the guild")
				.addStringOption((command) => command.setName("player_name").setDescription("The name of the player you'd like to mute.").setRequired(true))
				.addStringOption((options) => options.setName("time_period").setDescription("Time period to mute").setRequired(true))
				.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
		});
	}

	async execute({ interaction, discordCommandMap }: CommandExecution): Promise<void> {
		if (await this.hasPermissionToExecute({ interaction, discordCommandMap })) {
			this.getBotInstance()
				.getMineflayerInstance()
				.chat(`/g mute ${interaction.options.get("player_name")?.value} ${interaction.options.get("time_period")?.value}`);
			await interaction.editReply("Command has been executed!");
		}
	}
}
