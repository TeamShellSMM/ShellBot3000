describe('!random / !playersRandom', function () {
  beforeEach(async () => {
    await TEST.setupData({
      Members: [
        {
          name: 'Mod',
          discord_id: '128',
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
          level_name: 'level1',
          creator: 2,
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
        },
        {
          level_name: 'level2',
          creator: 2,
          code: 'XXX-XXX-XX2',
          status: 0,
          difficulty: 0,
        },
        {
          level_name: 'level3',
          creator: 2,
          code: 'XXX-XXX-XX3',
          status: 1,
          difficulty: 1,
        },
      ],
    });
  });

  it('no players', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!playersRandom',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(result, 'You did not provide any players ');
  });

  it('no players', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!playersRandom 3',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(result, 'You did not provide any players ');
  });

  it('unknown player @curr', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!playersRandom Mod,Other 1 10',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(result, 'Other is not found in the memory banks ');
  });

  it('!random check difficulty min only', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!random 1',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      'You have ran out of levels in this range (1) ',
    );
  });

  it('!random check difficulty swapped min and max', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!random 3 1',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      'You have ran out of levels in this range (1-3) ',
    );
  });

  it('!random check difficulty', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!random 1 3',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      'You have ran out of levels in this range (1-3) ',
    );
  });
});
