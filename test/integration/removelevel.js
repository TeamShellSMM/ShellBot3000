describe('!removelevel', function () {
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
      "You didn't enter a level code. ",
    );
  });

  it('No reason', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!removelevel xxx-xxx-xxx',
        channel: 'general',
        discord_id: '256',
      }),
      'Missing parameter. You have to enter something here. ',
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
      '"user removed level" by Creator has already been removed ',
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
