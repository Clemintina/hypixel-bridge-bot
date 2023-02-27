import { ChatInputCommandInteraction, Client } from "discord.js";
import { exit } from "process";

const RestartBot = async (client: Client, interaction: ChatInputCommandInteraction): Promise<void> => {
	if (interaction.commandName == "restart") {
		// This type of restart is designed to be used with PM2.
		exit(0);
	}
};

export default RestartBot;
