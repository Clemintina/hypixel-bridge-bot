import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from "discord.js";
import { config, MinecraftBot } from "../index";

export type CommandRegister = {
	commandBuilder: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
	discordClient: Client<true>;
	botInstance: MinecraftBot;
	permissionNodes?: Set<string>;
};

export type CommandExecution = {
	interaction: ChatInputCommandInteraction;
	discordCommandMap: Map<string, CommandBase>;
};

export abstract class CommandBase {
	private readonly discordClient: CommandRegister["discordClient"];
	private readonly slashCommandBuilder: CommandRegister["commandBuilder"];
	private readonly botInstance: CommandRegister["botInstance"];
	private readonly permissionNodes = new Set();

	protected constructor({ commandBuilder, discordClient, botInstance, permissionNodes }: CommandRegister) {
		this.discordClient = discordClient;
		this.slashCommandBuilder = commandBuilder;
		this.botInstance = botInstance;
		if (permissionNodes) {
			this.permissionNodes = permissionNodes;
		} else {
			this.permissionNodes.add(commandBuilder.name);
		}
	}

	protected getClient = () => this.discordClient;

	protected getCommandBuilder = () => this.slashCommandBuilder;

	protected getPermissions = () => this.permissionNodes;

	protected getBotInstance = () => this.botInstance;

	protected hasPermissionToExecute = async ({ interaction, discordCommandMap }: CommandExecution) => {
		const guild = this.discordClient.guilds.cache.get(config.discord.id);
		if (guild) {
			const member = guild.members.cache.get(interaction.user.id);
			if (member) {
				const discordRoleIds = config.discord.permissions;
				const result = discordRoleIds.filter((role) => member.roles.cache.has(role.roleId));
				const perms: Array<string> = [];
				result.forEach((resultArray) =>
					resultArray.allowList.forEach((perm) => {
						perms.push(perm.toLowerCase());
						if (perm.toLowerCase() == "all") {
							discordCommandMap.forEach((value) => perms.push(value.getCommandBuilder().name.toLowerCase()));
						}
					}),
				);

				const valid = perms.filter((value) => this.getPermissions().has(value.toLowerCase())).length > 0;
				if (valid) {
					return true;
				} else {
					await interaction.editReply("You don't have permission to use this command.");
				}
			}
		}
	};

	abstract execute({}: CommandExecution): Promise<void>;
}
