describe('!fixapprove', function () {
  beforeEach(async () => {
    await TEST.clearChannels();
    await TEST.setupData({
      Members: [
        {
          name: 'Creator',
          discord_id: '64',
        },
        {
          name: 'Mod1',
          discord_id: '128',
          is_mod: 1,
        },
      ],
      Levels: [
        {
          level_name: 'need fix reupload',
          creator: 1,
          code: 'XXX-XXX-XXX',
          status: TEST.ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD,
          difficulty: 0,
        },
        {
          level_name: 'rejected',
          creator: 1,
          code: 'XXX-XXX-XX2',
          status: TEST.ts.LEVEL_STATUS.REJECTED,
          difficulty: 0,
        },
        {
          level_name: 'approved reuploaded',
          creator: 1,
          code: 'XXX-XXX-XX3',
          status: TEST.ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOADED,
          difficulty: 0,
        },
        {
          level_name: 'need fixreject',
          creator: 1,
          code: 'XXX-XXX-XX4',
          status: TEST.ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD,
          difficulty: 0,
        },
      ],
      PendingVotes: [
        {
          player: 2,
          code: 1,
          type: 'fix',
          difficulty_vote: 2,
          reason: "It's a bit janky innit",
        },
        {
          player: 2,
          code: 3,
          type: 'approve',
          difficulty_vote: 2,
          reason: 'Is good',
        },
        {
          player: 2,
          code: 4,
          type: 'fix',
          difficulty_vote: 1,
          reason: 'better fix or reject',
        },
      ],
    });
  });

  it('fixapprove of pending fixed reupload level', async () => {
    await TEST.createChannel({
      name: 'XXX-XXX-XXX',
      parent: TEST.ts.channels.pendingReuploadCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!fixapprove "that was a fix."',
      channel: 'XXX-XXX-XXX',
      discord_id: '128',
    });
    assert.equal(
      result[1].author.name,
      'You fixed your level up nicely and it got approved for difficulty 2.0, good job!',
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    assert.isOk(level);
    assert.equal(level.code, 'XXX-XXX-XXX');
    assert.equal(level.status, TEST.ts.LEVEL_STATUS.APPROVED);
  });

  it('fixapprove of pending not fixed reupload level', async () => {
    await TEST.createChannel({
      name: 'XXX-XXX-XX4',
      parent: TEST.ts.channels.pendingReuploadCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!fixapprove "It is acceptable as it is"',
      channel: 'XXX-XXX-XX4',
      discord_id: '128',
    });
    assert.equal(
      result[1].author.name,
      "You didn't reupload your level, but it got approved for difficulty 1.0 anyway. Seems like the issues mentioned weren't a big deal.",
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XX4' })
      .first();
    assert.isOk(level);
    assert.equal(level.code, 'XXX-XXX-XX4');
    assert.equal(level.status, TEST.ts.LEVEL_STATUS.APPROVED);
  });

  it('fixapprove of pending approved reupload', async () => {
    await TEST.createChannel({
      name: 'XXX-XXX-XX3',
      parent: TEST.ts.channels.pendingReuploadCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!fixapprove "nice reupload!"',
      channel: 'XXX-XXX-XX3',
      discord_id: '128',
    });
    assert.equal(
      result[1].author.name,
      'This level was already approved before, and now your reupload is as well.',
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XX3' })
      .first();
    assert.isOk(level);
    assert.equal(level.status, TEST.ts.LEVEL_STATUS.APPROVED);
  });

  it('reject outside pendingReupload category', async () => {
    await TEST.createChannel({
      name: 'XXX-XXX-XX4',
    });
    const result = await TEST.mockBotSend({
      cmd: '!fixreject "unfortunately no"',
      channel: 'XXX-XXX-XX4',
      discord_id: '128',
    });
    assert.equal(
      result,
      'This channel is not in the pending reupload category ',
    );
  });

  it('not in a valid code format channel ', async () => {
    assert.lengthOf(
      await TEST.mockBotSend({
        cmd: '!fixreject "unfortunately no"',
        channel: 'general',
        waitFor: 500,
        discord_id: '128',
      }),
      0,
    );
  });

  it('reject success', async () => {
    await TEST.createChannel({
      name: 'XXX-XXX-XX4',
      parent: TEST.ts.channels.pendingReuploadCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!fixreject "unfortunately no"',
      channel: 'XXX-XXX-XX4',
      discord_id: '128',
    });
    assert.equal(result[0], '**<@64>, we got some news for you: **');
    // TODO: make helper test fuction to check field titles
    assert.equal(
      result[1].author.name,
      "We're really sorry, but this level was rejected after you refused to reupload.",
    );
  });

  it('reject success ', async () => {
    await TEST.createChannel({
      name: 'XXX-XXX-XX4',
      parent: TEST.ts.channels.pendingReuploadCategory,
    });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!fixreject',
        channel: 'XXX-XXX-XX4',
        discord_id: '128',
      }),
      'Please provide a short message to the creator explaining your decision! ',
    );
  });

  it('reject level not need_fix', async () => {
    await TEST.createChannel({
      name: 'XXX-XXX-XX3',
      parent: TEST.ts.channels.pendingReuploadCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!fixreject "unfortunately no"',
      channel: 'XXX-XXX-XX3',
      discord_id: '128',
    });
    assert.equal(
      result,
      'Level is not in a valid fix status (this should not happen)! ',
    );
  });
});
