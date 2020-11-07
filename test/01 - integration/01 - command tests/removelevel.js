describe('!removelevel', function () {
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

  it('No code', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!removelevel',
        channel: 'general',
        discord_id: '256',
      }),
      `>>> **!requestremoval __<levelCode>__ <reason>**\n${await TEST.mockMessageReply(
        'error.noCode',
        { type: 'userError', discord_id: 256 },
        {},
      )}`,
    );
  });

  it('No reason', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!removelevel xxx-xxx-xxx',
        channel: 'general',
        discord_id: '256',
      }),
      `>>> **!requestremoval <levelCode> __<reason>__**\n${await TEST.mockMessageReply(
        'error.missingParameter',
        { type: 'userError', discord_id: 256 },
        {},
      )}`,
    );
  });

  it('Not mod or creator', async function () {
    assert.equal(
      (
        await TEST.mockBotSend({
          cmd: '!removelevel xxx-xxx-xxx long reason',
          channel: 'general',
          discord_id: '512',
        })
      )[2],
      "Your deletion request was received, we'll get back to you in a bit!",
    );
  });

  it('Removed by creator', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!removelevel XXX-XXX-XXX long reason',
      channel: 'general',
      waitFor: 100,
      discord_id: '256',
    });
    assert.equal(
      result[2],
      "Your deletion request was received, we'll get back to you in a bit!",
    );
  });

  it('Already removed', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!removelevel XXX-XXX-XX3 long reason',
        channel: 'general',
        waitFor: 100,
        discord_id: '256',
      }),
      `>>> **!requestremoval __<levelCode>__ <reason>**\n${await TEST.mockMessageReply(
        'removeLevel.alreadyRemoved',
        { type: 'userError', discord_id: 256 },
        { level_name: 'user removed level', creator: 'Creator' },
      )}`,
    );
  });

  it('removed by mod', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!removelevel XXX-XXX-XXX long reason',
      channel: 'general',
      waitFor: 100,
      discord_id: '128',
    });
    assert.equal(
      result[2],
      "Your deletion request was received, we'll get back to you in a bit!",
    );
  });
});
