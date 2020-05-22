describe('!reupload', function () {
  beforeEach(async () => {
    const initData = {
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
        {
          name: 'Another Creator',
          discord_id: '256',
        },
      ],
      Levels: [
        {
          level_name: 'pending level',
          creator: 1,
          code: 'XXX-XXX-XX1',
          status: TEST.ts.LEVEL_STATUS.PENDING,
          difficulty: 0,
        },
        {
          level_name: 'approved level',
          creator: 1,
          code: 'XXX-XXX-XX2',
          status: TEST.ts.LEVEL_STATUS.APPROVED,
          difficulty: 5,
        },
        {
          level_name: 'need fix level',
          creator: 1,
          code: 'XXX-XXX-XX3',
          status: TEST.ts.LEVEL_STATUS.NEED_FIX,
          difficulty: 0,
        },
        {
          level_name: 'removed level',
          creator: 1,
          code: 'XXX-XXX-XX5',
          status: TEST.ts.LEVEL_STATUS.REMOVED,
          difficulty: 1,
        },
        {
          level_name: 'user removed level',
          creator: 1,
          code: 'XXX-XXX-XX6',
          status: TEST.ts.LEVEL_STATUS.REMOVED,
          difficulty: 1,
        },
        {
          level_name: 'free approved level',
          creator: 1,
          code: 'XXX-XXX-XX7',
          status: TEST.ts.LEVEL_STATUS.APPROVED,
          difficulty: 5,
          is_free_submission: 1,
        },
        {
          level_name: "Another creator's level",
          creator: 2,
          code: 'XXX-XXX-XX8',
          status: TEST.ts.LEVEL_STATUS.PENDING,
          difficulty: 0,
        },
        {
          level_name: 'Already reuploaded code',
          creator: 1,
          code: 'XXX-XXX-XX9',
          new_code: 'XXX-XXX-X10',
          status: TEST.ts.LEVEL_STATUS.REUPLOADED,
          difficulty: 0,
        },
        {
          level_name: 'User removed',
          creator: 1,
          code: 'XXX-XXX-X11',
          status: TEST.ts.LEVEL_STATUS.USER_REMOVED,
          difficulty: 2,
        },
        {
          level_name: 'User removed neex fix',
          creator: 1,
          code: 'XXX-XXX-X12',
          status: TEST.ts.LEVEL_STATUS.USER_REMOVED,
          old_status: TEST.ts.LEVEL_STATUS.NEED_FIX,
          difficulty: 2,
        },
      ],
    };

    await TEST.setupData(initData);
    TEST.ts.teamVariables['Minimum Point'] = 0;
    TEST.ts.teamVariables['New Level'] = 0;
  });

  it('nothing given', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!reupload',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'reupload.noOldCode',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it('no new code given', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!reupload XXX-XXX-XXX',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'reupload.noNewCode',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });
  it('invalid old code', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!reupload XXX-XX-XXX',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'reupload.invalidOldCode',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it('invalid new code', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!reupload XXX-XXX-XXX YYY-YYY',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'reupload.invalidNewCode',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it('same code', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!reupload XXX-XXX-XXX XXX-XXX-XXX',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'reupload.sameCode',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it('no reason', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!reupload XXX-XXX-XXX YYY-YYY-YYY',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'reupload.giveReason',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it('not registered', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!reupload XXX-XXX-XX1 YYY-YYY-YYY long reason',
      channel: 'general',
      discord_id: '1337',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'error.notRegistered',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it('level to be reuploaded not found', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!reupload YYY-XXX-XX1 YYY-YYY-YYY long reason',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'error.levelNotFound',
        { type: 'userError' },
        { code: 'YYY-XXX-XX1' },
      ),
    );
  });

  it('New level exists and has different creator than original level', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!reupload XXX-XXX-XX1 XXX-XXX-XX8 long reason',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'reupload.differentCreator',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it('New level exists and level is not pending or approved', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!reupload XXX-XXX-XX1 XXX-XXX-XX9 long reason',
        channel: 'general',
        discord_id: '64',
      }),
      await TEST.mockMessage('reupload.wrongApprovedStatus', {
        type: 'userError',
      }),
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!reupload XXX-XXX-XX1 XXX-XXX-XX5 long reason',
        channel: 'general',
        discord_id: '64',
      }),
      await TEST.mockMessage('reupload.wrongApprovedStatus', {
        type: 'userError',
      }),
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!reupload XXX-XXX-XX1 XXX-XXX-XX6 long reason',
        channel: 'general',
        discord_id: '64',
      }),
      await TEST.mockMessage('reupload.wrongApprovedStatus', {
        type: 'userError',
      }),
    );
  });

  it('no permission', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!reupload XXX-XXX-XX1 XXX-XXX-YYY long reason',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      "You can't reupload 'pending level' by Creator ",
    );
  });

  it('not enough points, but reuploading approved=can', async () => {
    TEST.ts.teamVariables['New Level'] = 5;
    await TEST.ts.db.Members.query()
      .patch({ clear_score_sum: 0 })
      .where({ discord_id: '64' });
    const result = await TEST.mockBotSend({
      cmd: '!reupload XXX-XXX-XX1 XXX-XXX-YYY long reason',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result,
      "<@64> You have reuploaded 'pending level' by Creator with code `XXX-XXX-YYY`. ",
    );
  });

  it('Level has already been reuploaded', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!reupload XXX-XXX-XX9 XXX-XXX-YYY long reason',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'reupload.haveReuploaded',
        { type: 'userError' },
        { code: 'XXX-XXX-X10' },
      ),
    );
  });

  it('creator successful reupload pending level with just enough points', async () => {
    await TEST.clearChannels();
    TEST.ts.teamVariables['New Level'] = 1;
    await TEST.ts.db.Members.query()
      .patch({ clear_score_sum: 2 })
      .where({ discord_id: '64' });

    const player = await TEST.ts.getUser('64');
    // check if can't upload a new level with current points
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!add XXX-XXX-YYY test name',
        channel: 'general',
        discord_id: '64',
      }),
      await TEST.mockMessage(
        'points.cantUpload',
        { type: 'userError', discord_id: '64' },
        {
          points_needed: player.earned_points.pointsNeeded,
        },
      ),
    );

    assert.notExists(
      await TEST.findChannel({
        name: 'XXX-XXX-YYY',
        parentID: TEST.ts.channels.pendingReuploadCategory,
      }),
      'channel not be created in the normal pending list',
    );

    // check can upload a new level with current points
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!reupload XXX-XXX-XX1 XXX-XXX-YYY long reason',
        channel: 'general',
        discord_id: '64',
      }),
      await TEST.mockMessage(
        'reupload.success',
        { type: 'registeredSuccess', discord_id: '64' },
        {
          level: {
            level_name: 'pending level',
            creator: 'Creator',
          },
          newCode: 'XXX-XXX-YYY',
        },
      ),
    );
  });

  it('Succesful approved level reupload. Generate the right status and create the proper channels', async () => {
    await TEST.clearChannels();
    TEST.ts.teamVariables['New Level'] = 1;
    await TEST.ts.db.Members.query()
      .patch({ clear_score_sum: 3 })
      .where({ discord_id: '64' });
    // check can upload a new level with current points
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!reupload XXX-XXX-XX2 XXX-XXX-YYY long reason',
        channel: 'general',
        discord_id: '64',
      }),
      (await TEST.mockMessage(
        'reupload.success',
        { type: 'registeredSuccess', discord_id: '64' },
        {
          level: {
            level_name: 'approved level',
            creator: 'Creator',
          },
          newCode: 'XXX-XXX-YYY',
        },
      )) + TEST.ts.message('reupload.inReuploadQueue'),
    );

    const oldLevel = await TEST.ts
      .getLevels()
      .where({ code: 'XXX-XXX-XX2' })
      .first();
    const newLevel = await TEST.ts
      .getLevels()
      .where({ code: 'XXX-XXX-YYY' })
      .first();

    assert.exists(oldLevel);
    assert.exists(newLevel);

    assert.equal(oldLevel.status, TEST.ts.LEVEL_STATUS.REUPLOADED);
    assert.equal(
      newLevel.status,
      TEST.ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOAD,
    );

    assert.notExists(
      await TEST.findChannel({
        name: 'XXX-XXX-YYY',
        parentID: TEST.ts.channels.levelDiscussionCategory,
      }),
      'channel not created in the normal pending list',
    );

    assert.exists(
      await TEST.findChannel({
        name: 'XXX-XXX-YYY',
        parentID: TEST.ts.channels.pendingReuploadCategory,
      }),
      'a channel created in the pending reupload list',
    );
  });

  it('reupload a user removed needfix level with a pending level. status should be correct', async () => {
    await TEST.clearChannels();
    await TEST.ts.db.Members.query()
      .patch({ is_mod: 1 })
      .where({ discord_id: '128' });
    // check can upload a new level with current points
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!reupload XXX-XXX-X12 XXX-XXX-XX1 long reason',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> You have reuploaded 'User removed neex fix' by Creator with code `XXX-XXX-XX1`.  Your level has also been put in the reupload queue, we'll get back to you shortly.",
    );

    const oldLevel = await TEST.ts
      .getLevels()
      .where({ code: 'XXX-XXX-X12' })
      .first();
    const newLevel = await TEST.ts
      .getLevels()
      .where({ code: 'XXX-XXX-XX1' })
      .first();

    assert.exists(oldLevel);
    assert.exists(newLevel);

    assert.equal(oldLevel.status, TEST.ts.LEVEL_STATUS.REMOVED);
    assert.equal(
      newLevel.status,
      TEST.ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD,
    );

    assert.exists(
      await TEST.findChannel({
        name: 'XXX-XXX-XX1',
        parentID: TEST.ts.channels.pendingReuploadCategory,
      }),
      'a channel created in the pending reupload list',
    );
  });

  it('Succesful need_fix level reupload. Generate the right status and create the proper channels', async () => {
    await TEST.clearChannels();
    TEST.ts.teamVariables['New Level'] = 1;
    await TEST.ts.db.Members.query()
      .patch({ clear_score_sum: 3 })
      .where({ discord_id: '64' });
    // check can upload a new level with current points
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!reupload XXX-XXX-XX3 XXX-XXX-YYY long reason',
        channel: 'general',
        discord_id: '64',
      }),
      (await TEST.mockMessage(
        'reupload.success',
        { type: 'registeredSuccess', discord_id: '64' },
        {
          level: {
            level_name: 'need fix level',
            creator: 'Creator',
          },
          newCode: 'XXX-XXX-YYY',
        },
      )) + TEST.ts.message('reupload.inReuploadQueue'),
    );
    
    it('should check if mods are pinged')

    const oldLevel = await TEST.ts
      .getLevels()
      .where({ code: 'XXX-XXX-XX3' })
      .first();
    const newLevel = await TEST.ts
      .getLevels()
      .where({ code: 'XXX-XXX-YYY' })
      .first();

    assert.exists(oldLevel);
    assert.exists(newLevel);

    assert.equal(oldLevel.status, TEST.ts.LEVEL_STATUS.REMOVED);
    assert.equal(
      newLevel.status,
      TEST.ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD,
    );

    assert.notExists(
      await TEST.findChannel({
        name: 'XXX-XXX-YYY',
        parentID: TEST.ts.channels.levelDiscussionCategory,
      }),
      'channel not created in the normal pending list',
    );

    assert.exists(
      await TEST.findChannel({
        name: 'XXX-XXX-YYY',
        parentID: TEST.ts.channels.pendingReuploadCategory,
      }),
      'a channel created in the pending reupload list',
    );
  });

  it('Succesful user removed reupload', async () => {
    await TEST.clearChannels();
    TEST.ts.teamVariables['New Level'] = 0;
    await TEST.ts.db.Members.query()
      .patch({ clear_score_sum: 3 })
      .where({ discord_id: '64' });
    // check can upload a new level with current points
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!reupload XXX-XXX-X11 XXX-XXX-YYY long reason',
        channel: 'general',
        discord_id: '64',
      }),
      "<@64> You have reuploaded 'User removed' by Creator with code `XXX-XXX-YYY`. ",
    );
  });

  it('Succesful pending level reupload. Discussion channel exists, rename channel', async () => {
    await TEST.clearChannels();
    await TEST.createChannel({
      name: 'XXX-XXX-XX1',
      parent: TEST.ts.channels.levelDiscussionCategory,
    });

    TEST.ts.teamVariables['New Level'] = 1;
    await TEST.ts.db.Members.query()
      .patch({ clear_score_sum: 3 })
      .where({ discord_id: '64' });

    const result = await TEST.mockBotSend({
      cmd: '!reupload XXX-XXX-XX1 XXX-XXX-YYY long reason',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result[0],
      'This level has been reuploaded from XXX-XXX-XX1 to XXX-XXX-YYY.',
    ); // check can upload a new level with current points
    assert.equal(
      result[1],
      "Reupload Request for <@64>'s level with message: long reason",
    ); // check can upload a new level with current points
    assert.equal(
      result[2].author.name,
      'The Judgement  has now begun for this level:',
    );

    assert.notExists(
      await TEST.findChannel({
        name: 'XXX-XXX-XX1',
        parentID: TEST.ts.channels.levelDiscussionCategory,
      }),
      "old channel shouuldn't exist",
    );

    assert.exists(
      await TEST.findChannel({
        name: 'XXX-XXX-YYY',
        parentID: TEST.ts.channels.levelDiscussionCategory,
      }),
      'next channel should exist',
    );

    assert.notExists(
      await TEST.findChannel({
        name: 'XXX-XXX-YYY',
        parentID: TEST.ts.channels.pendingReuploadCategory,
      }),
      "new channel shouldn't exist in pending reupload",
    );
  });
});
