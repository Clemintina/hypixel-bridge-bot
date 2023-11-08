import axios from "axios";
import { Components } from "@zikeji/hypixel";

export class SeraphCache {
	private headers = {
		"User-Agent": "hypixel-bridge-bot",
	};

	public getPlayerByName = async (userName: string) => {
		const { data, status } = await axios.get<{ id: string; name: string }>(`https://cache.seraph.si/seraph/username/${userName}`, { headers: { ...this.headers } });
		if (status == 200) {
			return data.id;
		} else {
			return null;
		}
	};

	public getPlayer = async (uuid: string) => {
		let checkedUuid;
		if (uuid.length == 32 || uuid.length == 36) {
			checkedUuid = uuid;
		} else {
			const res = await this.getPlayerByName(uuid);
			if (res == null) return null;
			checkedUuid = res;
		}

		const { data, status } = await axios.get(`https://cache.seraph.si/player/${checkedUuid}`, { headers: { ...this.headers } });
		return data.success && status == 200 ? (data.player as Components.Schemas.Player) : null;
	};

	/**
	 * Fetches Cached stats from the Seraph API, Viewable within Discord using the bot.
	 * @param uuid
	 * @param mode
	 */
	public getCachedPlayer = async (uuid: string, mode: "daily" | "weekly" | "monthly") => {
		let checkedUuid;
		if (uuid.length == 32 || uuid.length == 36) {
			checkedUuid = uuid;
		} else {
			const res = await this.getPlayerByName(uuid);
			if (res == null) return null;
			checkedUuid = res;
		}

		const { data, status } = await axios.get(`https://cache.seraph.si/seraph/${mode}/${checkedUuid}`, { headers: { ...this.headers } });
		return data.success && status == 200 ? (data.data as Components.Schemas.Player) : null;
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
