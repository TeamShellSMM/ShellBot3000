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
      'You did not give a level code ',
    );
  });

  it('No reason', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!removelevel xxx-xxx-xxx',
        channel: 'general',
        discord_id: '256',
      }),
      "You did not provide a reason to remove this level. If you want to reupload, we recommend using the `!reupload` command. If you want to remove it now and reupload it later make sure __you don't lose the old code__ ",
    );
  });

  it('Not mod or creator', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!removelevel xxx-xxx-xxx long reason',
        channel: 'general',
        discord_id: '512',
      }),
      'You can\'t remove "approved level" by Creator ',
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
      result[1],
      '<@256> You have removed "approved level" by Creator ',
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    assert.exists(level);
    assert.equal(level.status, TEST.ts.LEVEL_STATUS.USER_REMOVED);
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
      '<@128> You have removed "approved level" by Creator ',
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    assert.exists(level);
    assert.equal(level.status, TEST.ts.LEVEL_STATUS.REMOVED);
  });
});
