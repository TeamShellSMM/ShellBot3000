describe('misc-integration', () => {
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
          name: 'Other',
          discord_id: '512',
        },
      ],
      Levels: [
        {
          level_name: 'approved level',
          creator: 2,
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
          likes: 0,
        },
        {
          level_name: 'pending level',
          creator: 2,
          code: 'XXX-XXX-XX2',
          status: 0,
          difficulty: 0,
          tags: 'removetag1,tag2,removetag3,all_locked,remove_locked',
        },
        {
          level_name: 'pending level2',
          creator: 2,
          code: 'XXX-XXX-XX3',
          status: 0,
          difficulty: 0,
          tags: 'tag2',
        },
        {
          level_name: 'approved level 2',
          creator: 2,
          code: 'XXX-XXX-XX4',
          status: 1,
          difficulty: 1,
          likes: 100,
        },
      ],
    });
    TEST.ts.teamVariables.ChannelsShellbotAllowed = null;
  });

  it('!refresh', async () => {
    await TEST.ts.db.Members.query()
      .patch({ is_mod: 1 })
      .where({ discord_id: 128 });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!refresh',
        channel: TEST.ts.channels.modChannel,
        discord_id: '128',
      }),
      'Reloaded data!',
    );
  });

  it('!random', async () => {
    await TEST.ts.db.Levels.query()
      .patch({ likes: 100 })
      .where({ id: 4 });
    const random = sinon.stub(Math, 'random');
    const randInt = sinon.stub(TEST.ts, 'getRandomInt');
    random.returns(0.1);
    randInt.returns(0);
    const result = await TEST.mockBotSend({
      cmd: '!random',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(result[1].title, 'approved level (XXX-XXX-XXX)');

    random.returns(0.5);
    randInt.returns(1);
    const result2 = await TEST.mockBotSend({
      cmd: '!random',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(result2[1].title, 'approved level 2 (XXX-XXX-XX4)');
    sinon.restore();
  });

  it('!playersRandom', async () => {
    await TEST.ts.db.Levels.query()
      .patch({ likes: 100 })
      .where({ id: 4 });
    const random = sinon.stub(Math, 'random');
    const randInt = sinon.stub(TEST.ts, 'getRandomInt');
    random.returns(0.5);
    randInt.returns(1);
    const result = await TEST.mockBotSend({
      cmd: '!playersRandom Mod,Other',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result[1].author.name,
      'Autobot rolled a d97 and found this level for Mod,Other',
    );
    assert.equal(result[1].title, 'approved level 2 (XXX-XXX-XX4)');
    sinon.restore();
  });

  /* it('TSModel, ts error', async () => {
    const canRun = sinon.stub(TS, 'teams');
    canRun.throws(new Error('caution'));
    const result = await TEST.mockBotSend({
      cmd: '!playersRandom Mod,Other',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(result, 'Error: caution');
    canRun.restore();
  }); */

  it('!help', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!help',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(result, await TEST.ts.message(`help`));
  });

  it('!help unknown command', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!help lol',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      await TEST.ts.message(`help.unknownCommand`),
    );
  });

  it('help ko', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!help:ko',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(result, await TEST.ts.message(`help`));
  });

  it('!points shellbot not allowed=fail', async () => {
    TEST.ts.teamVariables.ChannelsShellbotAllowed = 'not-general';
    const result = await TEST.mockBotSend({
      cmd: '!points',
      waitFor: 100,
      channel: 'general',
      discord_id: '256',
    });
    assert.lengthOf(result, 0);
  });

  it('!help shellbot not allowed=show help', async () => {
    TEST.ts.teamVariables.ChannelsShellbotAllowed = 'not-general';
    const result = await TEST.mockBotSend({
      cmd: '!help',
      waitFor: 100,
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(result, await TEST.ts.message(`help`));
  });

  it('!points shellbot in allowed', async () => {
    TEST.ts.teamVariables.ChannelsShellbotAllowed = 'general';
    const result = await TEST.mockBotSend({
      cmd: '!points',
      waitFor: 100,
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      '<@256> You have 0.0 clear points. You have submitted 4 levels .You have enough points to upload a level  You have earned the rank **no rank** ',
    );
  });

  it('!help shellbot allowed', async () => {
    TEST.ts.teamVariables.ChannelsShellbotAllowed = 'general';
    const result = await TEST.mockBotSend({
      cmd: '!help',
      waitFor: 100,
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(result, await TEST.ts.message(`help`));
  });
});
