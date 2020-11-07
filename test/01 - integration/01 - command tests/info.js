describe('!info', function () {
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
        },
        {
          level_name: 'user removed level',
          creator: 2,
          code: 'XXX-XXX-XX3',
          status: TEST.ts.LEVEL_STATUS.USER_REMOVED,
          difficulty: 0,
        },
      ],
    });
  });

  it('no code', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!info',
        channel: 'general',
        discord_id: '256',
      }),
      `>>> **!info __<levelCode>__**\n${await TEST.mockMessageReply(
        'error.noCode',
        { type: 'userError', discord_id: 256 },
        {},
      )}`,
    );
  });

  it('success', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!info xxx-xxx-xxx',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(result[0], '<@256> ');
    assert.equal(result[1].title, 'approved level (XXX-XXX-XXX)');
  });
});
