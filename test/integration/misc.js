const TS = require('../../src/TS');

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
  });

  it('!refresh', async () => {
    await TEST.ts.db.Members.query()
      .patch({ is_mod: 1 })
      .where({ discord_id: 128 });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!refresh',
        channel: 'general',
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

  it('TSModel, ts error', async () => {
    const canRun = sinon.stub(TS, 'teams');
    canRun.throws(new Error('caution'));
    const result = await TEST.mockBotSend({
      cmd: '!playersRandom Mod,Other',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(result, 'Error: caution');
    canRun.restore();
  });

  it('!help', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!help',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      '\n• To do anything, you will have to register first by using `!register` in the right channel.\n• To get a list of levels go to SITE_URL/levels.\n• Then you can now submit your clears of level by using `!clear LEV-ELC-ODE`\n• You can also `!login` and submit your clears in the site\n• You can submit a level by using `!add LEV-ELC-ODE level name`',
    );
  });

  it('!help', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!help lol',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      '\n• To do anything, you will have to register first by using `!register` in the right channel.\n• To get a list of levels go to SITE_URL/levels.\n• Then you can now submit your clears of level by using `!clear LEV-ELC-ODE`\n• You can also `!login` and submit your clears in the site\n• You can submit a level by using `!add LEV-ELC-ODE level name`',
    );
  });

  it('!help ko', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!help ko',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      '\n• 무엇이든하려면 오른쪽 채널에서 `!register` 를 사용하여 먼저 등록해야합니다.\n• 레벨 목록을 보려면 SITE_URL/levels 로 이동하십시오.\n• 이제 `!clear LEV-ELC-OD` 를 사용하여 레벨 클리어를 제출할 수 있습니다\n• 당신은 또한 `!login` 을 할 수 있고 사이트에서 당신의 비운을 제출할 수 있습니다\n• `!add LEV-ELC-ODE level name` 을 사용하여 레벨을 제출할 수 있습니다.\n\n이것은 기계 번역입니다. 번역이 틀렸다면 알려주십시오. <:SpigRobo:628051703320805377>',
    );
  });

  it('!help korean', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!help korean',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      '\n• 무엇이든하려면 오른쪽 채널에서 `!register` 를 사용하여 먼저 등록해야합니다.\n• 레벨 목록을 보려면 SITE_URL/levels 로 이동하십시오.\n• 이제 `!clear LEV-ELC-OD` 를 사용하여 레벨 클리어를 제출할 수 있습니다\n• 당신은 또한 `!login` 을 할 수 있고 사이트에서 당신의 비운을 제출할 수 있습니다\n• `!add LEV-ELC-ODE level name` 을 사용하여 레벨을 제출할 수 있습니다.\n\n이것은 기계 번역입니다. 번역이 틀렸다면 알려주십시오. <:SpigRobo:628051703320805377>',
    );
  });
});
