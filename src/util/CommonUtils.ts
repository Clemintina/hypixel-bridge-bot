import axios, { AxiosError } from "axios";
import { MinecraftBot } from "../index";
import chalk from "chalk";
import { SeraphCache } from "./SeraphCache";

import pino from "pino";

const RANK_REGEX = /\[[a-zA-Z+]+?]/gi;
const logger = pino({
	transport: {
		target: "pino-pretty",
	},
});

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
	else if (!Number.isInteger(playerValue)) displayValue = playerValue.toFixed(2);
	else if (Number.isNaN(playerValue)) displayValue = 0;
	return displayValue.toString();
};

export const formatNumber = (num: number | undefined) => {
	if (typeof num === "number") return num.toLocaleString();
	return "0";
};

export const sanatiseMessage = (message: string, customWord?: string) => {
	return message.replace(RANK_REGEX, customWord ?? "").trim();
};

export const useHypixelApi = async (botInstance: MinecraftBot, apiCaller: (hypixelClient: SeraphCache) => Promise<void>) => {
	try {
		const hypixelClient = new SeraphCache();
		return await apiCaller(hypixelClient);
	} catch (exceptionThrown) {
		if (exceptionThrown instanceof AxiosError) {
			botInstance.getMineflayerInstance().chat("This player is invalid!  Maybe you typed their name incorrectly.");
		}
	}
};

export const logToConsole = (logType: "info" | "warning" | "error" | "chat", message: string | Error) => {
	switch (logType) {
		case "info":
			logger.info(chalk.cyan(`${chalk.white(`[`)}INFO${chalk.white(`]`)} ${message}`));
			break;
		case "warning":
			logger.warn(chalk.yellowBright(`${chalk.white(`[`)}WARNING${chalk.white(`]`)} ${message}`));
			break;
		case "error":
			logger.error(message);
			break;
		case "chat":
			logger.info(chalk.blue(`${chalk.white(`[`)}CHAT${chalk.white(`]`)} ${message}`));
			break;
	}
};

export const padNumber = (n: number) => ("0" + n).slice(-2);
