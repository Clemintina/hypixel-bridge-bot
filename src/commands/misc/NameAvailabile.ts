import { CommandBase, CommandExecute } from "../../util/CommandHandler";
import { MinecraftBot } from "../../index";
import axios from "axios";
import { PlayerDB } from "../../util/CustomTypes";

class NameAvailableCommand extends CommandBase {
	constructor(minecraftBot: MinecraftBot) {
		super({ name: "name", description: "Checks if a name is available.", minecraftBot });
	}

	public execute = async ({ params }: CommandExecute) => {
		if (params.length == 1) {
			const { data, status } = await axios.get<PlayerDB>(`https://playerdb.co/api/player/minecraft/${params}`);
			if (status == 500) {
				this.getBotInstance().getMineflayerInstance().chat("This name is available.");
			} else if (status == 200) {
				const cachedAt = new Date(data.data.player.meta.cached_at);
				this.getBotInstance().getMineflayerInstance().chat(`[${cachedAt.toLocaleString()}] ${data.data.player.username} is unavailable.`);
			} else {
				this.getBotInstance().getMineflayerInstance().chat(`There was an error with this request, please try again later. Code: ${status} | Response: ${data}`);
			}
		} else {
			this.getBotInstance().getMineflayerInstance().chat("Please enter a name to check.");
		}
	};
}

export default NameAvailableCommand;
