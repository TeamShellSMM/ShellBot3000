'use strict';

const { AkairoClient } = require('discord-akairo');
const TS = require('./TS.js');
const DiscordLog = require('./DiscordLog');
const WebApi = require('./WebApi');
const DiscordWrapper = require('../src/DiscordWrapper');

const devVars =
  process.NODE_ENV !== 'production'
    ? {
        debug: true,
        blockBots: false,
        blockClient: false,
        defaultCooldown: 0,
      }
    : {};

const client = new AkairoClient({
  prefix: '!',
  disableEveryone: true,
  defaultCooldown: 500,
  commandDirectory: 'src/commands/',
  ...devVars,
});

client.on('guildCreate', async (guild) => {
  DiscordLog.log(`Joined a new guild: ${guild.name}`, client);
});

client.on('ready', async () => {
  await DiscordLog.log(
    `ShellBot3000 (${process.env.NODE_ENV}) has started , with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`,
    client,
  );
  const Teams = require('./models/Teams')();
  const teams = await Teams.query().select();
  if (!teams) throw new Error(`No teams configurations buzzyS`);

  for (const team of teams) {
    const guild = await client.guilds.find(
      (guild) => guild.id == team.guild_id,
    );
    if (team && guild) {
      await TS.add(guild.id, client);
    }
  }
});

(async () => {
  // main thread
  try {
    await client.login(process.env.DISCORD_TOKEN);
    DiscordWrapper.setClient(client);
    const app = await WebApi(client);
    await app.listen(process.env.WEB_PORT, () =>
      DiscordLog.log(
        `ShellBot3000 (${process.env.NODE_ENV}):WebApi now listening on ${process.env.WEB_PORT}`,
        client,
      ),
    );
  } catch (error) {
    DiscordLog.error(error.stack, client);
  }
})();
