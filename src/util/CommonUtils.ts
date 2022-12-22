import axios from "axios";

const RANK_REGEX = /\[[a-zA-Z+]+?]/gi;

export const getPlayerUuid = async (username: string) => {
    console.log(username);
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
