import { ChatInputCommandInteraction, Client } from "discord.js";

const RestartBot = async (client: Client, interaction: ChatInputCommandInteraction): Promise<void> => {
	if (interaction.commandName == "restart") {
		// This type of restart is designed to be used with PM2.
		process.exitCode = 0;
	}
};

export default RestartBot;
