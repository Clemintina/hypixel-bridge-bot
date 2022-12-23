declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MINECRAFT_EMAIL: string;

            BOT_PREFIX: string;

            PROXY_IP: string;
            PROXY_PORT: string;
            PROXY_USERNAME: string;
            PROXY_PASSWORD: string;

            DISCORD_TOKEN: string;
            DISCORD_LOGGING_CHANNEL: string;
            DISCORD_GUILD_ID: string;
            DISCORD_CLIENT_ID: string;
            DISCORD_ADMIN_ROLE: string;
            DISCORD_ADMIN_CHANNEL_ID: string;
        }
    }
}

export {};
