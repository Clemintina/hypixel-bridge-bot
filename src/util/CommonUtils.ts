import axios, { AxiosError } from "axios";
import { Client, InvalidKeyError } from "@zikeji/hypixel";
import { getAppConfig } from "../index";
import { Bot } from "mineflayer";

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

export const sanatiseMessage = (message: string, customWord?: string) => {
	return message.replace(RANK_REGEX, customWord ?? "");
};

export const useHypixelApi = async (botInstance: Bot, apiCaller: (hypixelClient: Client) => Promise<void>) => {
	try {
		const hypixelClient = new Client(getAppConfig().hypixelApiKey);
		return await apiCaller(hypixelClient);
	} catch (exceptionThrown) {
		if (exceptionThrown instanceof InvalidKeyError) {
			botInstance.chat("Invalid API Key, Generating...");
			await botInstance.waitForTicks(40);
			botInstance.chat("/api new");
		} else if (exceptionThrown instanceof AxiosError) {
			botInstance.chat("This player is invalid!  Maybe you typed their name incorrectly.");
		}
	}
};
