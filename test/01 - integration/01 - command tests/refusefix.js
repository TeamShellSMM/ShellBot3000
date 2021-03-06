describe('!refusefix', function () {
  before(async () => {
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
        {
          level_name: 'refused fix level',
          creator: 1,
          code: 'XXX-XXX-X13',
          status: TEST.ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD,
          difficulty: 2,
        },
        {
          level_name: 'need fix level',
          creator: 1,
          code: 'XXX-XXX-X14',
          status: TEST.ts.LEVEL_STATUS.NEED_FIX,
          difficulty: 0,
        },
      ],
    };

    await TEST.clearChannels();
    await TEST.setupData(initData);
    TEST.ts.teamVariables['Minimum Point'] = 0;
    TEST.ts.teamVariables['New Level'] = 0;
  });

  it('nothing given', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!refusefix',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result,
      `>>> **!refusefix __<levelCode>__ <reason>**\n${await TEST.mockMessageReply(
        'error.noCode',
        { type: 'userError', discord_id: 64 },
        {},
      )}`,
    );
  });

  it('no reason', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!refusefix XXX-XXX-XX3',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result,
      `>>> **!refusefix <levelCode> __<reason>__**\n${await TEST.mockMessageReply(
        'error.missingParameter',
        { type: 'userError', discord_id: 64 },
        {},
      )}`,
    );
  });

  it('not need fix', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!refusefix XXX-XXX-XX1 do not want',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result,
      'This level is not currently in a fix request! ',
    );
  });

  it('not creator', async () => {
    await TEST.clearChannels();
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!refusefix XXX-XXX-XX3 long reason',
        channel: 'general',
        discord_id: '256',
      }),
      'You can only use this command on one of your own levels that currently has an open fix request. ',
    );
  });

  it('already refusedfix', async () => {
    await TEST.clearChannels();
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!refusefix XXX-XXX-X13 long reason',
        channel: 'general',
        discord_id: '64',
      }),
      'You already sent this reupload request back! ',
    );
  });

  it('creator successful refusefix', async () => {
    await TEST.ts.db.PendingVotes.query().insert({
      guild_id: 1,
      player: 2,
      code: 3,
      type: 'fix',
      reason: 'Needs fixing',
    });
    await TEST.ts.db.PendingVotes.query().insert({
      guild_id: 1,
      player: 3,
      code: 3,
      type: 'fix',
      reason: 'So needs fixing',
    });
    await TEST.clearChannels();
    const result = await TEST.mockBotSend({
      cmd: '!refusefix XXX-XXX-XX3 long reason',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result[1],
      '<@128>, <@256> please check if your fixes were made.',
    );
    assert.deepInclude(result[2], {
      title: 'need fix level (XXX-XXX-XX3)',
      description:
        'Refused by: Please check the fixvotes and decide if this is still acceptable to approve or not (use **!fixapprove** or **!fixreject** with a message).',
      url: 'http://localhost:8080/makerteam/level/XXX-XXX-XX3',
      color: 31743,
      author: {
        name: 'This level has NOT been reuploaded!',
        iconURL: undefined,
        url: undefined,
      },
    });
    assert.equal(
      result[3],
      "Your level was put in the reupload queue, we'll get back to you in a bit!",
    );

    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XX3' })
      .first();
    assert.equal(
      level.status,
      TEST.ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD,
    );
    assert.exists(
      await TEST.findChannel({
        name: 'XXX-XXX-XX3',
        parentID: TEST.ts.channels.levelAuditCategory,
      }),
      'should be here',
    );
  });

  it('creator successful no ping', async () => {
    await TEST.clearChannels();
    const result = await TEST.mockBotSend({
      cmd: '!refusefix XXX-XXX-X14 long reason',
      channel: 'general',
      discord_id: '64',
    });
    assert.equal(
      result[2],
      "Your level was put in the reupload queue, we'll get back to you in a bit!",
    );

    assert.deepInclude(result[1], {
      title: 'need fix level (XXX-XXX-X14)',
      description:
        'Refused by: Please check the fixvotes and decide if this is still acceptable to approve or not (use **!fixapprove** or **!fixreject** with a message).',
      url: 'http://localhost:8080/makerteam/level/XXX-XXX-X14',
      color: 31743,
      author: {
        name: 'This level has NOT been reuploaded!',
        iconURL: undefined,
        url: undefined,
      },
    });
    assert.equal(
      result[0],
      "Reupload Request for <@64>'s level got refused with message: ```long reason```",
    );
  });
});
