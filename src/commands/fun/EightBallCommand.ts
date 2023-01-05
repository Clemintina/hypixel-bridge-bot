import { CommandBase } from "../../util/CommandHandler";
import { MinecraftBot } from "../../index";

class EightBallCommand extends CommandBase {
	constructor(minecraftBot: MinecraftBot) {
		super({ name: "8ball", description: "Gets a random reply", minecraftBot });
	}

	public execute = async () => {
		const commandMessages = ["It is certain", "Reply hazy, try again", "Don’t count on it", "It is decidedly so", "Ask again later", "My reply is no", "Without a doubt", "Better not tell you now", "My sources say no", "Yes definitely", "Cannot predict now", "Outlook not so good", "You may rely on it", "Concentrate and ask again", "Very doubtful", "As I see it, yes", "Most likely", "Outlook good"];

		this.getBotInstance()
			.getMineflayerInstance()
			.chat(commandMessages[(commandMessages.length * Math.random()) | 0]);
	};
}

export default EightBallCommand;
