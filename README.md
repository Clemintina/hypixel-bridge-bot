# Hypixel Discord bridge

### WARNING: This is not offically allowed on Hypixel!

A basic Mineflayer bot to connect to Hypixel and perform bot-like tasks for your guild such as stats checking, performing commands as an admin and allowing players on discord to communicate with players in-game and vice versa. 

This bot is still in development.

### Configuration:

1. Copy the contents of ``example.env``
2. Paste the contents into a file called ``.env``
3. Fill out the ``MINECRAFT_EMAIL`` and  ``BOT_PREFIX``
4. Authorise the bot to use your Minecraft account using the code generated

### For full Discord integration

1. Create a Discord Bot token. You can do this by going to this  [site](https://discord.com/developers) and:
   1. Press "New Application"
   2. Name your application
   3. IN General Information, Choose a **unique** name
   4. Copy your ``Application ID`` and paste it in to the ``.env`` file as the ``DISCORD_CLIENT_ID``
   5. Press "Bot"
   6. Press "Add Bot"
   7. Copy the Token into your ``.env`` file
   8. Disable "Public Bot"
   9. Enable the **Message Contents Intent**
   10. Press "OAuth2"
   11. Press "URL Generator"
   12. Under "Scopes", Enable ``Bot`` and ``applications.commands`` (REQUIRED for the bot to be able to add slash commands! )
   13. Under "Bot Permissions", Enable ``Send Messages`` and ``Read Message History``
   14. Copy the Generated URL in to your Browser or Discord and invite the Bot
   15. In Discord, Enable "Developer mode"
   16. Right click the Server icon and click ``Copy ID`` and paste this in to the ``.env`` file as the ``DISCORD_GUILD_ID``
   17. Create 2 channels, One for Guild members to use and one for Admins
   18. Right click each channel and click ``Copy ID`` and paste them in to the ``.env`` file as the ``DISCORD_LOGGING_CHANNEL`` and ``DISCORD_ADMIN_CHANNEL_ID``
   19. Make a new role ( or existing staff role ) for people who will have permission to Kick, Mute, Promote and Demote people. Copy the ID of this role and place it in to the ``.env`` file
   20. Start the bot in either development mode or production and ensure it has the message "Logging in to Discord"

### Using proxies

The bot allows for the use of ``SOCKS5`` proxies. You can buy them from any proxy seller and they should cost between 2-7$ a month for decent proxies. They don't need to be high quality, just have a decent bandwidth allowance each month,

You can enter the credentials into the ``.env`` file and the bot will recognise them without you needing to do anything.
