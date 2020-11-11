describe('!ammendcode', function () {
  before(async () => {
    await TEST.setupData({
      Members: [
        {
          name: 'Mod',
          discord_id: '128',
          is_mod: 1,
        },
        {
          name: 'Creator',
          discord_id: '256',
        },
        {
          name: 'Banned',
          discord_id: '-1',
          is_banned: 1,
        },
      ],
      Levels: [
        {
          level_name: 'approved level',
          creator: 2,
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
        },
        {
          level_name: 'pending level',
          creator: 2,
          code: 'XXX-XXX-XX2',
          status: 0,
          difficulty: 0,
        },
        {
          level_name: 'approved level',
          creator: 2,
          code: 'XXX-XXX-XX9',
          status: 1,
          difficulty: 1,
        },
      ],
    });
  });

  it('no arguments', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    assert.equal(
      result,
      `>>> **!amendcode __<oldCode>__ <newCode>**\n${await TEST.mockMessageReply(
        'error.noCode',
        { type: 'userError', discord_id: 128 },
        {},
      )}`,
    );
  });

  it('no new level code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    assert.equal(
      result,
      `>>> **!amendcode <oldCode> __<newCode>__**\n${await TEST.mockMessageReply(
        'error.noCode',
        { type: 'userError', discord_id: 128 },
        {},
      )}`,
    );
  });

  it('invalid old code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xx-xxx XXX-XXX-XXX',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    assert.equal(
      result,
      `>>> **!amendcode __<oldCode>__ <newCode>**\n${await TEST.mockMessageReply(
        'error.invalidCode',
        { type: 'userError', discord_id: 128 },
        {},
      )}`,
    );
  });

  it('invalid new code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx XXX-XX-XXX',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    assert.equal(
      result,
      `>>> **!amendcode <oldCode> __<newCode>__**\n${await TEST.mockMessageReply(
        'error.invalidCode',
        { type: 'userError', discord_id: 128 },
        {},
      )}`,
    );
  });

  it('same code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx XXX-XXX-XXX',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'reupload.sameCode',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it('new code is existing level', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx XXX-XXx-XX2',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'add.levelExisting',
        { type: 'userError' },
        {
          level: {
            level_name: 'pending level',
            creator: 'Creator',
            code: 'XXX-XXX-XX2',
            status: 0,
            difficulty: 0,
          },
        },
      ),
    );
  });

  it('not mod', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx xxx-xxx-xx3',
      channel: 'general',
      waitFor: 100,
      discord_id: '256',
    });
    assert.lengthOf(result, 156, 'no result');
  });

  it('owner successful', async function () {
    const ownerId = TEST.ts.discord.guild().owner.user.id;
    await TEST.clearChannels();
    // console.log(TEST.ts.channels.modChannel);
    await TEST.createChannel({
      name: 'XXX-XXX-XXX',
      parent: TEST.ts.channels.levelDiscussionCategory,
    });
    let result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx xxx-xxx-xx3',
      channel: TEST.ts.channels.modChannel,
      discord_id: ownerId,
    });
    if (result instanceof Array) {
      [, result] = result;
    }
    assert.equal(
      result,
      await TEST.mockMessage(
        'ammendCode.success',
        { type: 'normal' },
        {
          level: {
            level_name: 'approved level',
            creator: 'Creator',
            code: 'XXX-XXX-XXX',
            status: 1,
            difficulty: 1,
          },
          oldCode: 'XXX-XXX-XXX',
          newCode: 'XXX-XXX-XX3',
        },
      ),
    );
    const oldLevel = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    const newLevel = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XX3' })
      .first();
    assert.notExists(oldLevel);
    assert.exists(newLevel);

    await TEST.fetchGuild();

    const oldChannel = await TEST.findChannel({
      name: 'XXX-XXX-XXX',
      parentID: TEST.ts.channels.levelDiscussionCategory,
    });

    assert.notExists(oldChannel, "old channel doesn't exist");

    assert.exists(
      await TEST.findChannel({
        name: 'XXX-XXX-XX3',
        parentID: TEST.ts.channels.levelDiscussionCategory,
      }),
      'next channel should exist',
    );
  });

  it('discord admin, with no flag', async function () {
    delete TEST.ts.teamVariables.discordAdminCanMod;
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx xxx-xxx-xx3',
      channel: TEST.ts.channels.modChannel,
      waitFor: 100,
      discord_id: TEST.bot_id, // we use bot for now as bot was set to have admin rights in test server
      // TODO: make admin test users
    });
    assert.lengthOf(result, 119, 'no result');
  });

  it('discord admin, with flags', async function () {
    TEST.ts.teamVariables.discordAdminCanMod = 'true';
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xx9 xxx-xxx-xx5',
      channel: TEST.ts.channels.modChannel,
      discord_id: TEST.bot_id, // we use bot for now as bot was set to have admin rights in test server
      // TODO: make admin test users
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'ammendCode.success',
        { type: 'normal' },
        {
          level: {
            level_name: 'approved level',
            creator: 'Creator',
            code: 'XXX-XXX-XX9',
            status: 1,
            difficulty: 1,
          },
          oldCode: 'XXX-XXX-XX9',
          newCode: 'XXX-XXX-XX5',
        },
      ),
    );
  });
});
