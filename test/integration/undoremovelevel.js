describe('!undoremove', function () {
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
    assert.equal(
      result,
      await TEST.mockMessage(
        'error.noCode',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it('not mod or creator', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!undoremovelevel XXX-XXX-XX3 this is reason',
      channel: TEST.ts.channels.modChannel,
      discord_id: '512',
    });
    assert.lengthOf(result, 0, 'no result');
  });

  it('mod but no reason', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!undoremovelevel XXX-XXX-XX3',
        channel: TEST.ts.channels.modChannel,
        discord_id: '128',
      }),
      "Just leave a note why you're undoing the level remove ",
    );
  });

  it('mod but already approved', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!undoremovelevel XXX-XXX-XXX this is reason',
        channel: TEST.ts.channels.modChannel,
        discord_id: '128',
      }),
      '"approved level" by Creator is not removed ',
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
    assert.equal(
      result[2],
      '<@128> You have undid the status change of "user removed level" by Creator ',
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XX3' })
      .first();
    assert.equal(level.old_status, TEST.ts.LEVEL_STATUS.USER_REMOVED);
    assert.equal(level.status, TEST.ts.LEVEL_STATUS.APPROVED);
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
    assert.equal(
      result[2],
      '<@128> You have undid the status change of "removed level" by Creator ',
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XX2' })
      .first();
    assert.equal(level.old_status, TEST.ts.LEVEL_STATUS.REMOVED);
    assert.equal(level.status, TEST.ts.LEVEL_STATUS.APPROVED);
  });
});
