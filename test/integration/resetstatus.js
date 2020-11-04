describe('!resetstatus', function () {
  beforeEach(async () => {
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
      ],
    });
  });

  it('no level code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!resetstatus',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    assert.equal(
      result,
      `>>> **!resetstatus __<levelCode>__**\n${await TEST.mockMessageReply(
        'error.noCode',
        { type: 'userError', discord_id: 128 },
        {},
      )}`,
    );
  });

  it('not mod', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!resetstatus xxx-xxx-xxx',
      channel: 'general',
      waitFor: 100,
      discord_id: '256',
    });
    assert.notEqual(
      result,
      await TEST.mockMessage(
        'resetStatus.successful',
        { type: 'normal' },
        {
          level_name: 'approved level',
          creator: 'Creator',
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
        },
      ),
    );
    assert.lengthOf(result, 141, 'no result');
  });

  it('mod successful', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!resetstatus xxx-xxx-xxx',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'resetStatus.successful',
        { type: 'normal' },
        {
          level_name: 'approved level',
          creator: 'Creator',
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
        },
      ),
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    assert.equal(level.status, 0);
  });

  it('mod, but reset pending', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!resetstatus xxx-xxx-xx2',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'resetStatus.alreadyPending',
        { type: 'userError' },
        {
          level_name: 'pending level',
          creator: 'Creator',
          code: 'XXX-XXX-XX2',
          status: 1,
          difficulty: 1,
        },
      ),
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XX2' })
      .first();
    assert.equal(level.status, 0);
  });

  it('owner successful', async function () {
    const ownerId = TEST.ts.discord.guild().owner.user.id;
    const result = await TEST.mockBotSend({
      cmd: '!resetstatus xxx-xxx-xxx',
      channel: TEST.ts.channels.modChannel,
      discord_id: ownerId,
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'resetStatus.successful',
        { type: 'normal' },
        {
          level_name: 'approved level',
          creator: 'Creator',
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
        },
      ),
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    assert.equal(level.status, 0);
  });

  it('owner successful', async function () {
    const ownerId = TEST.ts.discord.guild().owner.user.id;
    const result = await TEST.mockBotSend({
      cmd: '!resetstatus xxx-xxx-xxx',
      channel: TEST.ts.channels.modChannel,
      discord_id: ownerId,
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'resetStatus.successful',
        { type: 'normal' },
        {
          level_name: 'approved level',
          creator: 'Creator',
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
        },
      ),
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    assert.equal(level.status, 0);
  });
  it('discord admin, with no flag', async function () {
    delete TEST.ts.teamVariables.discordAdminCanMod;
    const result = await TEST.mockBotSend({
      cmd: '!resetstatus xxx-xxx-xxx',
      channel: TEST.ts.channels.modChannel,
      waitFor: 100,
      discord_id: TEST.bot_id, // we use bot for now as bot was set to have admin rights in test server
      // TODO: make admin test users
    });
    assert.notEqual(
      result,
      await TEST.mockMessage(
        'resetStatus.successful',
        { type: 'normal' },
        {
          level_name: 'approved level',
          creator: 'Creator',
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
        },
      ),
    );
    assert.lengthOf(result, 141, 'no result');
  });

  it('discord admin, with flags', async function () {
    TEST.ts.teamVariables.discordAdminCanMod = 'true';
    const result = await TEST.mockBotSend({
      cmd: '!resetstatus xxx-xxx-xxx',
      channel: TEST.ts.channels.modChannel,
      discord_id: TEST.bot_id, // we use bot for now as bot was set to have admin rights in test server
      // TODO: make admin test users
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'resetStatus.successful',
        { type: 'normal' },
        {
          level_name: 'approved level',
          creator: 'Creator',
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
        },
      ),
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    assert.equal(level.status, 0);
  });
});
