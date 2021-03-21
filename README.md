## How it works

This bot gets the vCal from https://sd-twitch.live/live-calendar/calendarcache.php every minute and checks against the time to see who is playing, checks to see if it already posted that person, if not it posts the now playing message to any channel named #now-playing on its servers and pings the twitch api for streamer logo

### Setup

1. Make sure you are running node v12.21.0 or later
2. `git clone`
3. `npm install --only=prod`
4. Make a file named .env

    Write this into that file

    ```
    TOKEN=*DISCORD BOT TOKEN HERE*
    TWITCH_CID=*TWITCH CLIENT ID HERE*
    ```

    [How to get discord bot token and invite the bot (Make sure to give the bot permissions to write in the #now-playing channel)](https://www.writebots.com/discord-bot-token/)

    [Getting a twitch client id is more simple](https://dev.twitch.tv/docs/api/), btw just enter http://localhost into the OAuth redirection url

5. And you're done! Just run `node .`
