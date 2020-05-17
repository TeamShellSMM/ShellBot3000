'use strict';

const config = require('../config.json')[
  process.env.NODE_ENV || 'development'
];
const { AkairoClient } = require('discord-akairo');
const TS = require('./TS.js');
const DiscordLog = require('./DiscordLog');
const WebApi = require('./WebApi');

const client = new AkairoClient(config, {
  disableEveryone: true,
});

client.on('guildCreate', async (guild) => {
  DiscordLog.log(`Joined a new guild: ${guild.name}`, client);
});

client.on('ready', async () => {
  await DiscordLog.log(
    `${config.botName} has started , with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds. environment: ${process.env.NODE_ENV}`,
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

  if (config.initTestChannel && config.initCommand) {
    await client.channels
      .get(config.initTestChannel)
      .send(config.initCommand);
  }
});

(async () => {
  // main thread
  let app;
  try {
    await client.login(config.discord_access_token);
    app = await WebApi(client);
    await app.listen(config.webPort, () =>
      DiscordLog.log(
        `${config.botName}:WebApi now listening on ${config.webPort}`,
        client,
      ),
    );
  } catch (error) {
    DiscordLog.error(error.stack, client);
  }
})();
