import { Bot } from "mineflayer";

type CommandRegister = {
	name: string;
	description: string;
	minecraftBot: Bot;
};

export type CommandExecute = {
	player: string;
	message: string;
	params: Array<string>;
};

export abstract class CommandBase {
	private readonly name;
	private readonly description;
	private readonly minecraftInstance;

	protected constructor({ name, description, minecraftBot }: CommandRegister) {
		this.name = name;
		this.description = description;
		this.minecraftInstance = minecraftBot;
	}

	protected getName = () => {
		return this.name;
	};

	protected getDescription = () => {
		return this.description;
	};

	protected getBotInstance = () => {
		return this.minecraftInstance;
	};

	abstract execute({ player, message, params }: CommandExecute): void;
}
