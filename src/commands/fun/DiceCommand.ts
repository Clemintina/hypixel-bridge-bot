import { CommandBase, CommandExecute } from "../../util/CommandHandler";
import { MinecraftBot } from "../../index";

class DiceCommand extends CommandBase {
	constructor(minecraftBot: MinecraftBot) {
		super({ name: "roll", description: "Rolls a dice", minecraftBot });
	}

	private rollDice = async () => {
		return 1 + Math.floor(Math.random() * 6);
	};

	public execute = async ({ player }: CommandExecute) => {
		const diceResult = await this.rollDice();
		this.getBotInstance().getMineflayerInstance().chat(`${player} rolled a ${diceResult}`);
	};
}

export default DiceCommand;
