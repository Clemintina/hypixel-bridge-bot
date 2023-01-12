import axios, { AxiosError } from "axios";
import { Client, InvalidKeyError } from "@zikeji/hypixel";
import { getAppConfig, MinecraftBot } from "../index";
import chalk from "chalk";

const RANK_REGEX = /\[[a-zA-Z+]+?]/gi;

export const getPlayerUuid = async (username: string) => {
	if (username.length == 32 || username.length == 36) return username;
	const response = await axios.get(`https://playerdb.co/api/player/minecraft/${username}`);
	const player = response.data;
	if (player.code == "player.found") {
		return player.data.player.id;
	} else {
		return undefined;
	}
};

export const formatRatio = (num1: number, num2: number) => {
	const playerValue = num1 / num2;
	let displayValue: number | string = playerValue;
	if (!isFinite(playerValue)) displayValue = ~~Number((((0 - 18) / 0) * 100).toFixed(2));
	if (!Number.isInteger(playerValue)) displayValue = playerValue.toFixed(2);
	return displayValue.toString();
};

export const formatNumber = (num: number | undefined) => {
	if (typeof num === "number") return num.toLocaleString();
	return "0";
};

export const sanatiseMessage = (message: string, customWord?: string) => {
	return message.replace(RANK_REGEX, customWord ?? "").trim();
};

export const useHypixelApi = async (botInstance: MinecraftBot, apiCaller: (hypixelClient: Client) => Promise<void>) => {
	try {
		const hypixelClient = new Client(getAppConfig().hypixelApiKey);
		return await apiCaller(hypixelClient);
	} catch (exceptionThrown) {
		if (exceptionThrown instanceof InvalidKeyError) {
			botInstance.getMineflayerInstance().chat("Invalid API Key, Generating...");
			await botInstance.getMineflayerInstance().waitForTicks(40);
			botInstance.getMineflayerInstance().chat("/api new");
		} else if (exceptionThrown instanceof AxiosError) {
			botInstance.getMineflayerInstance().chat("This player is invalid!  Maybe you typed their name incorrectly.");
		}
	}
};

export const logToConsole = (logType: "info" | "warning" | "error" | "chat", message: string | Error) => {
	if (message instanceof Error) {
		console.log(chalk.redBright(message.name), chalk.redBright(message.message), message.stack);
	}
	switch (logType) {
		case "info":
			console.log(chalk.cyan(`${chalk.white(`[`)}INFO${chalk.white(`]`)} ${message}`));
			break;
		case "warning":
			console.log(chalk.yellowBright(`${chalk.white(`[`)}WARNING${chalk.white(`]`)} ${message}`));
			break;
		case "error":
			console.log(chalk.redBright(`${chalk.white(`[`)}ERROR${chalk.white(`]`)} ${message}`));
			break;
		case "chat":
			console.log(chalk.blue(`${chalk.white(`[`)}CHAT${chalk.white(`]`)} ${message}`));
			break;
	}
};
