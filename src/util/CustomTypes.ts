import { PlayerRank } from "@zikeji/hypixel";

export type PlayerDB = {
	code: string;
	message: string;
	data: {
		player: {
			meta: Record<string, never>;
			username: string;
			id: string;
			raw_id: string;
			avatar: string;
		};
	};
	success: boolean;
};

export type PlayerMapObject = {
	avatarUrl: string;
	uuid: string;
	rank: PlayerRank | null;
};

export type ConfigFile = {
	emojis: {
		hypixel: string;
		discord: string;
	};
	messages: Array<string>;
	guild: {
		id: string;
		requirements: {
			bedwars_wins: number;
		};
	};
};
