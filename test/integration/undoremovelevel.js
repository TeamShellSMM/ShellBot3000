describe('!undoremove', function () {
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
          status: TEST.ts.LEVEL_STATUS.APPROVED,
          old_status: TEST.ts.LEVEL_STATUS.PENDING,
          difficulty: 1,
        },
        {
          level_name: 'removed level',
          creator: 2,
          code: 'XXX-XXX-XX2',
          status: TEST.ts.LEVEL_STATUS.REMOVED,
          old_status: TEST.ts.LEVEL_STATUS.APPROVED,
          difficulty: 5,
        },
        {
          level_name: 'user removed level',
          creator: 2,
          code: 'XXX-XXX-XX3',
          status: TEST.ts.LEVEL_STATUS.USER_REMOVED,
          old_status: TEST.ts.LEVEL_STATUS.APPROVED,
          difficulty: 5,
        },
        {
          level_name: 'reuploaded level',
          creator: 2,
          code: 'XXX-XXX-XX4',
          status: TEST.ts.LEVEL_STATUS.REUPLOADED,
          new_code: 'XXX-XXX-YY4',
          old_status: TEST.ts.LEVEL_STATUS.APPROVED,
          difficulty: 5,
        },
      ],
    });
  });

  it('no level code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!undoremovelevel',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    assert.lengthOf(result, 89, 'no result');
  });

  it('not mod or creator', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!undoremovelevel XXX-XXX-XX3 this is reason',
      channel: TEST.ts.channels.modChannel,
      discord_id: '512',
    });
    assert.lengthOf(result, 141, 'no result');
  });

  it('mod but no reason', async function () {
    assert.lengthOf(
      await TEST.mockBotSend({
        cmd: '!undoremovelevel XXX-XXX-XX3',
        channel: TEST.ts.channels.modChannel,
        discord_id: '128',
      }),
      111,
      'no result',
    );
  });

  it('mod but already approved', async function () {
    assert.lengthOf(
      await TEST.mockBotSend({
        cmd: '!undoremovelevel XXX-XXX-XXX this is reason',
        channel: TEST.ts.channels.modChannel,
        discord_id: '128',
      }),
      141,
      'no result',
    );
  });

  it('mod user removed', async function () {
    await TEST.ts.db.Members.query()
      .patch({ is_mod: 1 })
      .where({ discord_id: '128' });
    const result = await TEST.mockBotSend({
      cmd: '!undoremovelevel XXX-XXX-XX3 this is reason',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    assert.lengthOf(result, 141, 'no result');
  });

  it('mod removed', async function () {
    await TEST.ts.db.Members.query()
      .patch({ is_mod: 1 })
      .where({ discord_id: '128' });
    const result = await TEST.mockBotSend({
      cmd: '!undoremovelevel XXX-XXX-XX2 this is reason',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    assert.lengthOf(result, 141, 'no result');
  });
});
