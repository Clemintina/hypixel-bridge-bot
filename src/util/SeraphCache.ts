import axios from "axios";
import { Components } from "@zikeji/hypixel";

export class SeraphCache {
	private headers = {
		"User-Agent": "hypixel-bridge-bot",
	};

	public getPlayer = async (uuid: string) => {
		const { data, status } = await axios.get(`https://cache.seraph.si/player/${uuid}`, { headers: { ...this.headers } });
		if (data.success && status == 200) {
			return data.player as Components.Schemas.Player;
		} else {
			return null;
		}
	};

	public getGuildByPlayer = async (uuid: string) => {
		const { data, status } = await axios.get(`https://cache.seraph.si/guild/player/${uuid}`, { headers: { ...this.headers } });
		if (data.success && status == 200) {
			return data.guild as Components.Schemas.Guild;
		} else {
			return null;
		}
	};

	public getGuildById = async (id: string) => {
		const { data, status } = await axios.get(`https://cache.seraph.si/guild/id/${id}`, { headers: { ...this.headers } });
		if (data.success && status == 200) {
			return data.guild as Components.Schemas.Guild;
		} else {
			return null;
		}
	};

	public getSkyblockProfile = async (uuid: string) => {
		const { data, status } = await axios.get(`https://cache.seraph.si/skyblock/profiles/${uuid}`, { headers: { ...this.headers } });
		if (data.success && status == 200) {
			return data.profiles as Components.Schemas.SkyBlockProfileCuteName;
		} else {
			return null;
		}
	};
}
