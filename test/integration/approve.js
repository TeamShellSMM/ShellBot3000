describe('!approve', function () {
  const initData = {
    Members: [
      {
        name: 'Creator',
        discord_id: '64',
      },
      {
        name: 'Mod1',
        discord_id: '128',
      },
      {
        name: 'Mod2',
        discord_id: '256',
      },
      {
        name: 'Mod3',
        discord_id: '512',
      },
    ],
    Levels: [
      {
        level_name: 'level1',
        creator: 1,
        code: 'XXX-XXX-XXX',
        status: 0,
        difficulty: 0,
        videos: 'http://twitch.tv,http://youtube.com',
      },
      {
        level_name: 'approved level',
        creator: 1,
        code: 'XXX-XXX-XX2',
        status: 1,
        difficulty: 1,
      },
      {
        level_name: 'removed level',
        creator: 1,
        code: 'XXX-XXX-XX3',
        status: -1,
        difficulty: 1,
      },
    ],
  };
  beforeEach(async () => {
    await TEST.clearChannels();
    await TEST.setupData(initData);
  });

  it('in non modChannel', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX 5 "is good level"',
      channel: 'general',
      waitFor: 100,
      discord_id: '256',
    });
    assert.lengthOf(result, 0, 'no result');
  });

  it('approve', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX 5 "is good level"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    const result2 = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX 2 "ya"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '512',
    });
    const channel = await TEST.ts
      .getGuild()
      .channels.find((c) => c.name === 'xxx-xxx-xxx');
    assert.isOk(channel);
    assert.equal(
      result,
      await TEST.mockMessage(
        'approval.voteAdded',
        {
          type: 'normal',
          discord_id: '256',
        },
        {
          channel_id: channel.id,
        },
      ),
    );
    // TODO: check embed info here: result3[1]
    const result3 = await TEST.mockBotSend({
      cmd: '!judge',
      channel: 'XXX-XXX-XXX',
      discord_id: '256',
    });
    assert.notEqual(
      result3,
      await TEST.mockMessage('approval.comboBreaker', {
        type: 'userError',
      }),
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    assert.isOk(level);
    assert.equal(level.code, 'XXX-XXX-XXX');
    assert.equal(level.status, TEST.ts.LEVEL_STATUS.APPROVED);
    assert.equal(level.difficulty, 3.5);
  });

  it('approve+cl', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!approve+cl XXX-XXX-XXX 5 "is good level"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    const plays = await TEST.ts
      .getPlays()
      .where({ player: 2 })
      .first();
    assert.deepInclude(plays, {
      liked: 1,
      completed: 1,
      code: 'XXX-XXX-XXX',
    });
  });

  it('approve+c', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!approve+c XXX-XXX-XXX 5 "is good level"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    const plays = await TEST.ts
      .getPlays()
      .where({ player: 2 })
      .first();
    assert.deepInclude(plays, {
      liked: 0,
      completed: 1,
      code: 'XXX-XXX-XXX',
    });
  });

  it('approve already approved level', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XX2 5 "is good level"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    assert.equal(result, 'Level is already approved! ');
  });

  it('approve no code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!approve',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    assert.equal(result, 'You did not give a level code ');
  });

  it('approve no reason', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX 5',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    assert.equal(
      result,
      'You need to give a reason for the change (in quotation marks)! ',
    );
  });

  it('approve invalid difficulty', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX invalid long reason',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    assert.equal(result, 'Invalid difficulty format! ');
  });

  it('approve not pending level', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XX3 5 "is good level"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    assert.equal(result, 'Level is not pending! ');
  });

  it('reject', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!reject XXX-XXX-XXX "is not good level"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    const channel = await TEST.ts
      .getGuild()
      .channels.find((c) => c.name === 'xxx-xxx-xxx');
    assert.isOk(channel);
    assert.equal(
      result,
      await TEST.mockMessage(
        'approval.voteAdded',
        {
          type: 'normal',
          discord_id: '256',
        },
        {
          channel_id: channel.id,
        },
      ),
    );

    const result2 = await TEST.mockBotSend({
      cmd: '!reject "no"',
      channel: 'xxx-xxx-xxx',
      discord_id: '512',
    });
    assert.equal(
      result2[1],
      await TEST.mockMessage(
        'approval.voteAdded',
        {
          type: 'normal',
          discord_id: '512',
        },
        {
          channel_id: channel.id,
        },
      ),
    );

    // TODO: check embed info here: result3[1]
    const result3 = await TEST.mockBotSend({
      cmd: '!judge',
      channel: 'XXX-XXX-XXX',
      discord_id: '256',
    });
    assert.notEqual(
      result3,
      await TEST.mockMessage('approval.comboBreaker', {
        type: 'userError',
      }),
    );

    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    assert.isOk(level);
    assert.equal(level.code, 'XXX-XXX-XXX');
    assert.equal(level.status, TEST.ts.LEVEL_STATUS.REJECTED);
    assert.equal(level.difficulty, 0);
  });

  it('fix', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!fix XXX-XXX-XXX 4 "Fix your jank"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    const result2 = await TEST.mockBotSend({
      cmd: '!fix XXX-XXX-XXX 2 "no"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '512',
    });
    const channel = await TEST.ts
      .getGuild()
      .channels.find((c) => c.name === 'xxx-xxx-xxx');
    assert.isOk(channel);
    assert.equal(
      result,
      await TEST.mockMessage(
        'approval.voteAdded',
        {
          type: 'normal',
          discord_id: '256',
        },
        {
          channel_id: channel.id,
        },
      ),
    );
    // TODO: check embed info here: result3[1]
    const result3 = await TEST.mockBotSend({
      cmd: '!judge',
      channel: 'XXX-XXX-XXX',
      discord_id: '256',
    });
    // TODO:Check result3 title content
    assert.notEqual(
      result3,
      await TEST.mockMessage('approval.comboBreaker', {
        type: 'userError',
      }),
    );
    assert.notEqual(
      result3,
      await TEST.mockMessage('approval.numVotesNeeded', {
        type: 'normal',
      }),
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    assert.isOk(level);
    assert.equal(level.code, 'XXX-XXX-XXX');
    assert.equal(level.status, TEST.ts.LEVEL_STATUS.NEED_FIX);
    assert.equal(level.difficulty, 0);
  });

  it('approve', async function () {
    await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX 5 "is good level"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX 2 "i changed my mind"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    const channel = await TEST.ts
      .getGuild()
      .channels.find((c) => c.name === 'xxx-xxx-xxx');
    assert.equal(
      result[1],
      `Your vote was changed in <#${channel.id}>!`,
    );
  });
});
