import axios from "axios";
import { Client, InvalidKeyError } from "@zikeji/hypixel";
import { getAppConfig } from "../index";
import { Bot } from "mineflayer";

const RANK_REGEX = /\[[a-zA-Z+]+?]/gi;

export const getPlayerUuid = async (username: string) => {
    if ( username.length == 32 || username.length == 36 ) return username;
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

export const sanatiseMessage = (message: string) => {
    return message.replace(RANK_REGEX, "");
};

export const useHypixelApi = ( botInstance: Bot,apiCaller: (hypixelClient:Client) => void ) => {
    try {
        const hypixelClient = new Client(getAppConfig().hypixelApiKey);
        apiCaller(hypixelClient);
    } catch ( exceptionThrown ){
        if (exceptionThrown instanceof InvalidKeyError) {
            botInstance.chat("Invalid API Key, Generating...");
            botInstance.waitForTicks(40)
            botInstance.chat("/api new");
        }
    }
};
