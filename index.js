/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
import fetch from 'node-fetch';
import https from 'https';
import Discord from 'discord.js';
const client = new Discord.Client();
import ICAL from 'ical.js';
import dotenv from 'dotenv';
import {setTimeout} from 'timers';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
dotenv.config();
dayjs.extend(utc);

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

function getUser(username, callback) {
    let opt;
    try {
        const apiPath = `/kraken/users?login=${username}`;
        opt = {
            host: 'api.twitch.tv',
            path: apiPath,
            headers: {
                'Client-ID': process.env.TWITCH_CID,
                'Accept': 'application/vnd.twitchtv.v5+json;',
            },
        };
    } catch (err) {
        console.log(err);
        return;
    }

    https
        .get(opt, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                let json;
                try {
                    json = JSON.parse(body);
                } catch (err) {
                    print(err);
                    return;
                }
                if (json.status == 404) {
                    callback(undefined);
                } else {
                    callback(json);
                }
            });
        })
        .on('error', (err) => {
            print(err);
        });
}

let last;

async function update() {
    const r = await fetch(
        'https://sd-twitch.live/live-calendar/calendarcache.php',
        {
            credentials: 'include',
            headers: {
                'User-Agent': 'discordbot',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
                'Accept-Language': 'en-US,en;q=0.5',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'max-age=0',
            },
            method: 'GET',
            mode: 'cors',
        },
    );

    setTimeout(() => {
        function objectMap(obj, func) {
            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k, func(v)]),
            );
        }

        const result = r.body.read().toString();
        const allEvent = ICAL.parse(result)[2]
            .filter((arr) => arr[0] === 'vevent')
            .map((arr) =>
                arr.filter((ee) => Array.isArray(ee) && ee.length !== 0),
            )
            .flatMap((e) =>
                e.map((ee) =>
                    ee.filter((eee) =>
                        [
                            'dtstart',
                            'dtend',
                            'summary',
                            'x-teamup-twitch-username',
                        ].includes(eee[0]),
                    ),
                ),
            )
            .map((e) =>
                e.map((ee) => {
                    const obj = {};
                    obj[ee[0]] = ee.splice(1);
                    return obj;
                }),
            )
            .map((e) => Object.assign(...e))
            .map((e) => objectMap(e, (ee) => ee[2]))
            .map((e) => {
                e.dtstart = dayjs.utc(e.dtstart).valueOf();
                e.dtend = dayjs.utc(e.dtend).valueOf();
                return e;
            })
            .filter((e) => e.dtend > Date.now())
            .sort((a, b) => a.dtstart - b.dtstart);
        if (last !== Object.values(allEvent[0])[3]) {
            getUser(Object.values(allEvent[0])[3], (j) => {
                const playingEmbed = new Discord.MessageEmbed()
                    .setColor('#00fd66')
                    .setAuthor('Now Playing:')
                    .setTitle(j.users[0].display_name)
                    .setURL(`https://twitch.tv/${j.users[0].name}`)
                    .setDescription('Come on! Join for a bit :)')
                    .setThumbnail(j.users[0].logo)
                    .setFooter('Bot developed by pisanvs');
                client.channels.cache
                    .find((e) => e.name == 'now-playing')
                    .send(playingEmbed);
                last = Object.values(allEvent[0])[3];
            });
        }
    }, 2000);
}

setInterval(() => update(), 1 * 1000 * 60);

client.login(process.env.TOKEN);
