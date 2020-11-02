global.TEST = {};
const chai = require('chai');
const { AkairoClient, CommandHandler } = require('discord-akairo');
const debug = require('debug');
const DiscordWrapper = require('../src/DiscordWrapper');
const TSClient = require('../src/TSClient.js');

const debugDiscordLog = debug('shellbot3000:log');
const debugDiscordError = debug('shellbot3000:error');
const debugMockMessages = debug('shellbot3000:mockMessages');
const debugGetMessages = debug('shellbot3000:onMessages');
const debugTests = debug('shellbot3000:test');
const WebApi = require('../src/WebApi');

global.assert = chai.assert;
global.sinon = require('sinon');
global.TEST.knex = require('../src/db/knex');
global.TEST.request = require('supertest');
global.TEST.TS = require('../src/TS.js');

global.TEST.debugTests = debugTests;
const DiscordLog = require('../src/DiscordLog');

DiscordLog.log = (msg) => {
  debugDiscordLog(msg);
};
DiscordLog.error = (e) => {
  debugDiscordError(e);
};

after(async () => {
  await TEST.client.destroy();
  await TEST.knex.destroy();
});

const RUNNING_COVERAGE = !!process.env.NYC_PROCESS_ID;

before(async () => {
  debugTests('setting up client');
  global.TEST.client = new TSClient();
  debugTests('logging in');
  await global.TEST.client.login(process.env.DISCORD_TEST_TOKEN);
  assert.exists(
    global.TEST.client,
    'should have discord client right now',
  );

  DiscordWrapper.setClient(global.TEST.client);

  let ready = false;

  //global.TEST.client.on('message', (m) => debugGetMessages(m.content));
  global.TEST.client.on('ready', async () => {
    ready = true;
  });

  while(!ready){
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  const guild = global.TEST.client.guilds.cache.get(process.env.TEST_GUILD);
  debugTests(guild.id);
  assert.exists(guild, 'TEST_GUILD needs to be valid');
  const allowTesting = guild.channels.cache.find(
    (channel) => channel.name === 'allow-shellbot-test-here',
  );
  assert(
    !!allowTesting,
    'The channel #allow-shellbot-test-here should exist in testing server and the testing bot should be able to see it.\nThe test script will nuke most of things in this server so make sure this is a server just for testing.',
  );

  debugTests('clear database');
  await TEST.knex.raw(`
    SET FOREIGN_KEY_CHECKS = 0;
    TRUNCATE table teams;
    TRUNCATE table points;
    TRUNCATE table ranks;
    TRUNCATE table team_settings;
    SET FOREIGN_KEY_CHECKS = 1;
  `);

  const defaultTeam = [
    {
      guild_id: process.env.TEST_GUILD,
      guild_name: 'MakerTeam',
      url_slug: 'makerteam',
      config: null,
    },
  ];
  const defaultSettings = [
    {
      guild_id: 1,
      name: 'TeamName',
      value: 'AutoTest',
      type: 'settings',
      admin_id: 1,
    },
    {
      guild_id: 1,
      name: 'ModName',
      value: 'Mod',
      type: 'settings',
      admin_id: 1,
    },
    {
      guild_id: 1,
      name: 'RegistrationChannel',
      value: 'general',
      type: 'settings',
      admin_id: 1,
    },
    {
      guild_id: 1,
      name: 'BotName',
      value: 'Autobot',
      type: 'settings',
      admin_id: 1,
    },
    {
      guild_id: 1,
      name: 'Minimum Point',
      value: 0,
      type: 'settings',
      admin_id: 1,
    },
    {
      guild_id: 1,
      name: 'New Level',
      value: 0,
      type: 'settings',
      admin_id: 1,
    },
    {
      guild_id: 1,
      name: 'VotesNeeded',
      value: 1,
      type: 'settings',
      admin_id: 1,
    },
    {
      guild_id: 1,
      name: 'memberRoleId',
      value: '701487078852001942',
      type: 'settings',
      admin_id: 1,
    },
    {
      guild_id: 1,
      name: 'VotesNeededReject',
      value: null,
      type: 'settings',
      admin_id: 1,
    },
    {
      guild_id: 1,
      name: 'VotesNeededFix',
      value: null,
      type: 'settings',
      admin_id: 1,
    },
    {
      guild_id: 1,
      name: 'includeOwnPoints',
      value: null,
      type: 'settings',
      admin_id: 1,
    },
    {
      guild_id: 1,
      name: 'approvedEmote',
      value: '<:test:123>',
      type: 'settings',
      admin_id: 1,
    },
    {
      guild_id: 1,
      name: 'CustomMessageTest',
      value: '{{BotName}}',
      type: 'messages',
      admin_id: 1,
    },
    {
      guild_id: 1,
      name: 'unknown',
      value: 'unknownValue',
      type: 'invalidType',
      admin_id: 1,
    },
    {
      guild_id: 1,
      name: 'modChannel',
      value: 'old-id',
      type: 'channels',
    },
  ];

  const defaultRanks = [
    {
      admin_id: 1,
      guild_id: 1,
      min_points: 0,
      rank: 'no rank',
      pips: '',
      discord_role: '',
    },
    {
      admin_id: 1,
      guild_id: 1,
      min_points: 5,
      rank: 'rank1',
      pips: '',
      discord_role: 'mockId1',
    },
    {
      admin_id: 1,
      guild_id: 1,
      min_points: 20,
      rank: 'rank2',
      pips: '',
      discord_role: 'mockId2',
    },
  ];

  debugTests('setup initial data');
  await TEST.knex.transaction(async (trx) => {
    await trx.raw('SET FOREIGN_KEY_CHECKS = 0; ');
    await trx('teams').insert(defaultTeam);
    await trx('team_settings').insert(defaultSettings);
    await trx('ranks').insert(defaultRanks);
    await trx.raw('SET FOREIGN_KEY_CHECKS = 1; ');
  });

  global.TEST.ts = await TEST.TS.add(
    process.env.TEST_GUILD,
    DiscordWrapper,
  );

  global.TEST.findChannel = ({ name, parentID }) => {
    return TEST.ts.discord.channel(name, parentID);
  };

  global.TEST.fetchGuild = async () => {
    return await TEST.ts.discord.fetchGuild();
  };

  TEST.bot_id = TEST.client.user.id;
  global.TEST.message = await TEST.findChannel({
    name: 'general',
  }).send('ShellBotted');
  await global.TEST.message.delete();

  global.app = await WebApi(TEST.client);

  global.TEST.mockMessage = async (
    template,
    { type, discord_id },
    args,
  ) => {
    const msg = await TEST.ts.message(template, args);
    if (type === 'userError')
      return msg + (await TEST.ts.message('error.afterUserDiscord'));
    if (type === 'registeredSuccess') {
      const user = await TEST.ts.getUser(discord_id);
      return user.userReply + msg;
    }
    return msg;
  };

  global.TEST.sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  global.TEST.setupData = async (data) => {
    debugTests('setup data');
    await TEST.knex.transaction(async (trx) => {
      await TEST.clearDb(trx);
      // eslint-disable-next-line guard-for-in,no-restricted-syntax
      for (const i in data) {
        for (let j = 0; j < data[i].length; j += 1) {
          await TEST.ts.db[i].query(trx).insert(data[i][j]);
        }
      }
    });
    await TEST.ts.recalculateAfterUpdate();
  };

  global.TEST.setupKnex = async (data) => {
    debugTests('setup knex');
    await TEST.knex.transaction(async (trx) => {
      // eslint-disable-next-line guard-for-in,no-restricted-syntax
      for (const i in data) {
        for (let j = 0; j < data[i].length; j += 1) {
          await trx(i).insert(data[i][j]);
        }
      }
    });
    await TEST.ts.recalculateAfterUpdate();
  };

  global.TEST.clearTable = async (table, trx) => {
    debugTests(`clear table ${table}`);
    return (trx || TEST.knex).raw(
      `
      SET FOREIGN_KEY_CHECKS = 0;
      TRUNCATE table ??;
      SET FOREIGN_KEY_CHECKS = 1;
    `,
      [table],
    );
  };

  global.TEST.clearDb = async (trx) => {
    debugTests('clear DB');
    return (trx || TEST.knex).raw(`
      SET FOREIGN_KEY_CHECKS = 0;
      TRUNCATE table plays;
      TRUNCATE table pending_votes;
      TRUNCATE table levels;
      TRUNCATE table level_tags;
      TRUNCATE table members;
      TRUNCATE table tokens;
      TRUNCATE table competition_winners;
      TRUNCATE table competitions;
      TRUNCATE table competition_groups;
      TRUNCATE table tags;
      TRUNCATE table seasons;
      TRUNCATE table videos;
      SET FOREIGN_KEY_CHECKS = 1;
    `);
  };

  global.TEST.checkStub = (func) => {
    return func.restore && func.restore.sinon;
  };

  global.TEST.acceptReply = () => {
    const sandbox = sinon.createSandbox();
    const cache = [];
    function collectReply(args) {
      debugMockMessages("collecting reply", args);
      cache.push(args);
    }

    function getMsg(channel, msg){
      debugMockMessages("getting msg");
      collectReply(msg);
    }

    const send = sandbox.fake(getMsg);
    const reply = sandbox.fake(getMsg);
    const DWreply = sandbox.fake(getMsg);
    const dm = sandbox.fake(getMsg);
    const messageSend = sandbox.fake(getMsg);
    const updatePin = sandbox.fake(getMsg);

    /*
    const createChannel = sandbox.fake(function (channel, args) {
      collectReply(['create-channel', channel, args]);
    });
    const channel = sandbox.fake(function (args) {
      collectReply(['find channel', args]);
      return {
        id: args,
        name: args,
      };
    }); */

    if (!TEST.checkStub(TEST.ts.discord.dm)) {
      debugTests('mocking discord.dm');
      sandbox.replace(TEST.ts.discord, 'dm', dm);
    }

    sandbox.replace(TEST.ts.discord, 'send', send);
    sandbox.replace(TEST.ts.discord, 'reply', reply);
    sandbox.replace(TEST.ts.DiscordWrapper, 'reply', DWreply);
    sandbox.replace(TEST.ts.discord, 'messageSend', messageSend);
    sandbox.replace(TEST.ts.discord, 'updatePinned', updatePin);
    // sandbox.replace(TEST.ts.discord, 'createChannel', createChannel);
    // sandbox.replace(TEST.ts.discord, 'channel', channel);
    return () => {
      sandbox.restore();
      if (cache.length === 1) return cache[0];
      return cache;
    };
  };

  global.TEST.initClearChannels = async () => {
    debugTests('initial clearing channels');
    const channels = global.TEST.ts.getGuild().channels.array();
    for (let i = 0; i < channels.length; i += 1) {
      const channel = channels[i];
      if (
        channel.name !== 'general' &&
        channel.name !== 'allow-shellbot-test-here'
      ) {
        await channel.delete('AUTOTEST');
      } else if (TEST.ts.validCode(channel.name)) {
        await channel.delete('AUTOTEST');
      }
    }
  };

  global.TEST.clearChannels = async () => {
    debugTests('clearing channels');
    const channels = global.TEST.ts.getGuild().channels.cache.array();
    for (let i = 0; i < channels.length; i += 1) {
      const channel = channels[i];
      if (
        (global.TEST.ts.channels.levelDiscussionCategory &&
          channel.parentID ===
            global.TEST.ts.channels.levelDiscussionCategory) ||
        (global.TEST.ts.channels.levelAuditCategory &&
          channel.parentID ===
            global.TEST.ts.channels.levelAuditCategory)
      ) {
        await channel.delete('AUTOTEST').catch(error => {
          if (error.code !== 10003) {
            throw error;
          }
        });
      } else if (TEST.ts.validCode(channel.name)) {
        await channel.delete('AUTOTEST').catch(error => {
          if (error.code !== 10003) {
            throw error;
          }
        });
      }
    }
  };
  /**
   * Create a channel
   * @param {Object} args passed parameter object
   * @param {string} args.name channel name
   * @param {string} args.parentID the id of the parent channel
   */
  global.TEST.createChannel = async ({ name, parent }) => {
    debugTests(`create channel ${name}`);
    try{
      await global.TEST.ts.discord.createChannel(name, {
        type: 'text',
        parent,
      });
    } catch(ex){

    }
  };

  global.TEST.expectReply = (waitFor = 10000) => {
    return new Promise(function (_fulfill, reject) {
      let clearId;
      const result = TEST.acceptReply();
      function fulfill() {
        clearTimeout(clearId);
        TEST.message.author.id = TEST.bot_id;
        TEST.TS.promisedCallback = null;
        _fulfill(result());
      }
      clearId = setTimeout(fulfill, waitFor);
      TEST.TS.promisedCallback = fulfill;
      TEST.ts.promisedReject = reject;
    });
  };

  global.TEST.mockBotSend = async ({
    cmd,
    channel,
    discord_id,
    waitFor,
    guildId,
  }) => {
    debugTests(`mock sending '${cmd}'`);
    global.TEST.message.author.id = discord_id;
    global.TEST.message.content = cmd;
    global.TEST.message.guild_id = guildId || process.env.TEST_GUILD;
    global.TEST.message.channel = TEST.ts.discord.channel(
      channel || 'general',
    );

    const ret = global.TEST.expectReply(waitFor);
    global.TEST.client.emit('message', TEST.message);
    return ret;
  };

  if (RUNNING_COVERAGE) {
    await TEST.initClearChannels();
  }

  const teamAdmin = sinon.stub(TEST.ts, 'teamAdmin');
  teamAdmin.returns(true);
  await TEST.mockBotSend({
    cmd: '!initchannels',
    channel: 'general',
    discord_id: TEST.ts.discord.botId(),
  });

  if (RUNNING_COVERAGE) {
    await TEST.knex('team_settings')
      .where({ type: 'channels' })
      .del();

    await TEST.mockBotSend({
      cmd: '!initchannels',
      channel: 'general',
      discord_id: TEST.ts.discord.botId(),
    });

    await TEST.mockBotSend({
      cmd: '!initchannels',
      channel: 'general',
      discord_id: TEST.ts.discord.botId(),
    });
  }
  teamAdmin.restore();
});

afterEach(async () => {
  sinon.restore();
});

describe('Setup test and check teams registration', function () {
  it('Creating discord connection and sending a message', async function () {
    assert.isOk(TEST.client, 'client is okay');
    assert.isOk(TEST.message, 'message is sent');
  });

  it('Creating team info and TS', async function () {
    const [teams] = await TEST.knex.raw(`SELECT * FROM teams;`);
    assert.lengthOf(teams, 1, 'Should have created teams');
    assert.isOk(TEST.ts, 'ts is created');
  });

  it('Creating web api', async function () {
    assert.isOk(app, 'App is created');
  });
});
