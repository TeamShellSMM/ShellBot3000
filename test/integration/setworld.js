describe('setworld', () => {
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
          maker_id: '123',
          maker_name: 'Creator',
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
      ],
    });
  });

  it('no arguments', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!setworld',
        channel: 'general',
        discord_id: '256',
      }),
      `>>> **!setworld __<worldCount>__ <levelCount> <worldName>**\n${await TEST.mockMessageReply(
        'error.invalidInt',
        { type: 'userError', discord_id: 256 },
        {},
      )}`,
    );
  });

  it('no level_count', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!setworld 1',
        channel: 'general',
        discord_id: '256',
      }),
      `>>> **!setworld <worldCount> __<levelCount>__ <worldName>**\n${await TEST.mockMessageReply(
        'error.invalidInt',
        { type: 'userError', discord_id: 256 },
        {},
      )}`,
    );
  });

  it('no world name', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!setworld 1 4',
        channel: 'general',
        discord_id: '256',
      }),
      `>>> **!setworld <worldCount> <levelCount> __<worldName>__**\n${await TEST.mockMessageReply(
        'error.missingParameter',
        { type: 'userError', discord_id: 256 },
        {},
      )}`,
    );
  });

  it('no maker id set', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!setworld 1 4 super auto world',
        channel: 'general',
        discord_id: '128',
      }),
      'You need to set your Maker ID and Name first with !makerid XXX-XXX-XXX Name ',
    );
  });

  it('success', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!setworld 1 4 super auto world',
        channel: 'general',
        discord_id: '256',
      }),
      '<@256> Your world was successfully set and should now show up on the worlds page',
    );
  });

  it('!unsetworld', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!unsetworld',
        channel: 'general',
        discord_id: '256',
      }),
      '<@256> Your world was successfully removed',
    );
  });
});
