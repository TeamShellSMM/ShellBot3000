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

  it('!commands', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!commands',
        channel: 'general',
        discord_id: '256',
      }),
      'You can find all the commands at <https://makerteams.net/features>',
    );
  });

  it('!random @curr', async () => {
    const random = sinon.stub(Math, 'random');
    random.returns(0.1);
    const result = await TEST.mockBotSend({
      cmd: '!random',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(result[1].title, 'approved level (XXX-XXX-XXX)');

    random.returns(0.5);
    const result2 = await TEST.mockBotSend({
      cmd: '!random',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(result2[1].title, 'approved level 2 (XXX-XXX-XX4)');
    sinon.restore();
  });

  it('!playersRandom', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!playersRandom Mod,Other',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result[1].author.name,
      'Autobot rolled a d97 and found this level for Mod,Other',
    );
    assert.equal(result[1].title, 'approved level (XXX-XXX-XXX)');
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
});
