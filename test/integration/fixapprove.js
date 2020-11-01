// const DiscordLog = require('../../src/DiscordLog');

describe('!fixapprove', function () {
  beforeEach(async () => {
    await TEST.clearChannels();
    await TEST.ts.load();
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
          level_name: 'formerly approved',
          creator: 1,
          code: 'XXX-XXX-XX0',
          new_code: 'XXX-XXX-XX3',
          status: TEST.ts.LEVEL_STATUS.REUPLOADED,
          difficulty: 2,
        },
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
          status: TEST.ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOAD,
          difficulty: 0,
        },
        {
          level_name: 'need fixreject',
          creator: 1,
          code: 'XXX-XXX-XX4',
          status: TEST.ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD,
          difficulty: 0,
        },
        {
          level_name: 'approved',
          creator: 1,
          code: 'XXX-XXX-XX5',
          status: TEST.ts.LEVEL_STATUS.APPROVED,
          difficulty: 1,
        },
        {
          level_name: 'pending',
          creator: 1,
          code: 'XXX-XXX-XX6',
          status: TEST.ts.LEVEL_STATUS.PENDING,
          difficulty: 0,
        },
        {
          level_name: 'approved reuploaded no old code',
          creator: 1,
          code: 'XXX-XXX-XX7',
          status: TEST.ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOAD,
          difficulty: 0,
        },
      ],
      PendingVotes: [
        {
          player: 2,
          code: 2,
          type: 'fix',
          difficulty_vote: 2,
          reason: "It's a bit janky innit",
        },
        {
          player: 2,
          code: 4,
          type: 'approve',
          difficulty_vote: 2,
          reason: 'Is good',
        },
        {
          player: 2,
          code: 5,
          type: 'fix',
          difficulty_vote: 1,
          reason: 'better fix or reject',
        },
      ],
    });
  });

  it('fixapprove pending not reupload', async () => {
    await TEST.createChannel({
      name: '🔨XXX-XXX-XX6',
      parent: TEST.ts.channels.levelAuditCategory,
    });

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!fixapprove "great fix"',
        channel: '🔨XXX-XXX-XX6',
        waitFor: 100,
        discord_id: '128',
      }),
      'Level is not in a valid fix status (this should not happen)! ',
    );
  });

  it('fixapprove pending approved reupload, but no old level', async () => {
    await TEST.createChannel({
      name: '🔁XXX-XXX-XX7',
      parent: TEST.ts.channels.levelAuditCategory,
    });

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!fixapprove "great fix"',
        channel: '🔁XXX-XXX-XX7',
        waitFor: 100,
        discord_id: '128',
      }),
      'Old level could not be found after reupload (this should not happen)! ',
    );
  });

  it('fixapprove not pending', async () => {
    await TEST.createChannel({
      name: '🔨XXX-XXX-XX5',
      parent: TEST.ts.channels.levelAuditCategory,
    });

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!fixapprove "great fix"',
        channel: '🔨XXX-XXX-XX5',
        waitFor: 100,
        discord_id: '128',
      }),
      'Level is not pending! ',
    );
  });

  it('fixapprove of pending fixed reupload level', async () => {
    await TEST.createChannel({
      name: '🔨XXX-XXX-XXX',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!fixapprove "that was a fix."',
      channel: '🔨XXX-XXX-XXX',
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
      name: '🔨XXX-XXX-XX4',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!fixapprove "It is acceptable as it is"',
      channel: '🔨XXX-XXX-XX4',
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
      name: '🔁XXX-XXX-XX3',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!fixapprove "nice reupload!"',
      channel: '🔁XXX-XXX-XX3',
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

  // Command doesn't react anymore outside the category
  /* it('reject outside pendingReupload category', async () => {
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
  }); */

  it('reject already fixed', async () => {
    await TEST.createChannel({
      name: '🔨XXX-XXX-XXX',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!fixreject "unfortunately no"',
      channel: '🔨XXX-XXX-XXX',
      discord_id: '128',
    });
    assert.equal(result[0], '**<@64>, we got some news for you: **');
    assert.deepInclude(result[1], {
      title: 'need fix reupload (XXX-XXX-XXX)',
      description:
        'made by Creator\nDifficulty: 0, Clears: 0, Likes: 0\n',
      url: null,
      color: 14431557,
      author: {
        name:
          "We're really sorry, but it seems there are still some issues after you reuploaded, so it got rejected for now.",
          iconURL: undefined,
        url: undefined,
      },
    });
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
      name: '🔨XXX-XXX-XX4',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!fixreject "unfortunately no"',
      channel: '🔨XXX-XXX-XX4',
      discord_id: '128',
    });
    assert.equal(result[0], '**<@64>, we got some news for you: **');
    // TODO: make helper test fuction to check field titles
    assert.equal(
      result[1].author.name,
      "We're really sorry, but this level was rejected after you refused to reupload.",
    );
    assert.equal(
      result[1].fields[0].value,
      '**Reason** :```"unfortunately no"```-<@128>',
    );
  });

  it('reject no reason', async () => {
    await TEST.createChannel({
      name: '🔨XXX-XXX-XX4',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!fixreject',
        channel: '🔨XXX-XXX-XX4',
        discord_id: '128',
      }),
      "Missing parameter. You have to enter something here. ",
    );
  });

  it('reject level that is approved pending', async () => {
    await TEST.createChannel({
      name: '🔁XXX-XXX-XX3',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!fixreject "unfortunately no"',
      channel: '🔁XXX-XXX-XX3',
      discord_id: '128',
    });
    assert.equal(
      result[1].author.name,
      "We're really sorry, but some kind of issues must have come up even though your level was already approved before. The level got rejected for now. Please check out the message below to see what's going on.",
    );
  });

  it('approve deletion request', async () => {
    await TEST.createChannel({
      name: '💀XXX-XXX-XX5',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    await TEST.createChannel({
      name: '🔢XXX-XXX-XX5',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!auditapprove needed to be deleted',
      channel: '💀XXX-XXX-XX5',
      discord_id: '128',
    });

    assert.equal(
      result[1].author.name,
      'This level has been removed by Mod1',
    );
    assert.equal(
      result[3].author.name,
      'A deletion request was approved and this level was removed from the list.',
    );
    assert.notExists(TEST.findChannel({ name: '💀XXX-XXX-XX5' }));
    assert.notExists(TEST.findChannel({ name: '🔢XXX-XXX-XX5' }));

    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XX5' })
      .first();
    assert.isOk(level);
    assert.equal(level.status, TEST.ts.LEVEL_STATUS.USER_REMOVED);
  });

  it('approve deletion request missing reason', async () => {
    await TEST.createChannel({
      name: '💀XXX-XXX-XX5',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!auditapprove',
      channel: '💀XXX-XXX-XX5',
      discord_id: '128',
    });

    assert.equal(
      result,
      "Missing parameter. You have to enter something here. ",
    );

    assert.exists(TEST.findChannel({ name: '💀XXX-XXX-XX5' }));
  });

  it('reject deletion request', async () => {
    await TEST.createChannel({
      name: '💀XXX-XXX-XX5',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!auditreject it gud',
      channel: '💀XXX-XXX-XX5',
      discord_id: '128',
    });

    assert.equal(
      result[1].author.name,
      "We're sorry, but your deletion request was rejected, we don't wanna take people's points away, so we'd like this one to stay in the list.",
    );
    assert.notExists(TEST.findChannel({ name: '💀XXX-XXX-XX5' }));

    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XX5' })
      .first();
    assert.isOk(level);
    assert.notEqual(level.status, TEST.ts.LEVEL_STATUS.USER_REMOVED);
  });

  it('reject deletion request missing reason', async () => {
    await TEST.createChannel({
      name: '💀XXX-XXX-XX5',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!auditreject',
      channel: '💀XXX-XXX-XX5',
      discord_id: '128',
    });

    assert.equal(
      result,
      "Missing parameter. You have to enter something here. ",
    );
  });

  it('approve rerate request', async () => {
    await TEST.createChannel({
      name: '🔢XXX-XXX-XX5',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!auditapprove 1.5 1',
      channel: '🔢XXX-XXX-XX5',
      discord_id: '128',
    });

    assert.equal(
      result[1].author.name,
      'A rerate request was approved for this level and the difficulty got updated from 1 to 1.5. Thanks for the report.',
    );
    assert.notExists(TEST.findChannel({ name: '🔢XXX-XXX-XX5' }));

    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XX5' })
      .first();
    assert.isOk(level);
    assert.equal(level.difficulty, 1.5);
  });

  it('approve rerate request missing difficulty and reason', async () => {
    await TEST.createChannel({
      name: '🔢XXX-XXX-XX5',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!auditapprove',
      channel: '🔢XXX-XXX-XX5',
      discord_id: '128',
    });

    assert.equal(result, "Missing parameter. You have to enter something here. ");
  });

  it('approve rerate request missing reason', async () => {
    await TEST.createChannel({
      name: '🔢XXX-XXX-XX5',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!auditapprove 1.5',
      channel: '🔢XXX-XXX-XX5',
      discord_id: '128',
    });

    assert.equal(
      result,
      "Missing parameter. You have to enter something here. ",
    );
  });

  it('reject rerate request', async () => {
    await TEST.createChannel({
      name: '🔢XXX-XXX-XX5',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!auditreject it alright',
      channel: '🔢XXX-XXX-XX5',
      discord_id: '128',
    });

    assert.equal(
      result[1].author.name,
      'Your rerate request was rejected, the difficulty of the level was NOT updated.',
    );
    assert.notExists(TEST.findChannel({ name: '🔢XXX-XXX-XX5' }));

    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XX5' })
      .first();
    assert.isOk(level);
    assert.notEqual(level.difficulty, 1.5);
  });

  it('reject rerate request missing reason', async () => {
    await TEST.createChannel({
      name: '🔢XXX-XXX-XX5',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!auditreject',
      channel: '🔢XXX-XXX-XX5',
      discord_id: '128',
    });

    assert.equal(
      result,
      "Missing parameter. You have to enter something here. ",
    );
  });

  it('amend level with open audit request', async () => {
    const ownerId = TEST.ts.discord.guild().owner.user.id;
    await TEST.createChannel({
      name: '🔢XXX-XXX-XX5',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!amendcode XXX-XXX-XX5 XXX-XXX-XXA',
      channel: TEST.ts.channels.modChannel,
      discord_id: ownerId,
    });

    assert.equal(
      result[0],
      'The level code has been ammended from `XXX-XXX-XX5` to `XXX-XXX-XXA`.',
    );

    assert.notExists(TEST.findChannel({ name: '🔢XXX-XXX-XX5' }));
    assert.exists(TEST.findChannel({ name: '🔢XXX-XXX-XXA' }));

    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXA' })
      .first();
    assert.exists(level);
    const oldLevel = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XX5' })
      .first();
    assert.notExists(oldLevel);
  });

  it('reupload level with open audit request', async () => {
    await TEST.createChannel({
      name: '🔢XXX-XXX-XX5',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    await TEST.createChannel({
      name: '🔨XXX-XXX-XX5',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!reupload XXX-XXX-XX5 XXX-XXX-XXA yea',
      channel: 'general',
      discord_id: '64',
    });

    assert.equal(
      result[3],
      "<@64> You have reuploaded 'approved' by Creator with code `XXX-XXX-XXA`.  If you want to rename the new level, you can use !rename new-code level name. Your level has also been put in the reupload queue, we'll get back to you shortly.",
    );

    assert.exists(TEST.findChannel({ name: '🔢XXX-XXX-XXA' }));
    assert.exists(TEST.findChannel({ name: '🔨XXX-XXX-XXA' }));
    assert.exists(TEST.findChannel({ name: '🔁XXX-XXX-XXA' }));

    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXA' })
      .first();
    assert.exists(level);
    const oldLevel = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XX5' })
      .first();
    assert.equal(oldLevel.status, TEST.ts.LEVEL_STATUS.REUPLOADED);
  });
});
