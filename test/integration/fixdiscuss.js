describe('!fixdiscuss', function () {
  beforeEach(async () => {
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
          level_name: 'reuploaded level',
          creator: 1,
          code: 'XXX-XXX-XX4',
          status: TEST.ts.LEVEL_STATUS.REUPLOADED,
          difficulty: 1,
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
          status: TEST.ts.LEVEL_STATUS.PENDING,
          difficulty: 0,
        },
      ],
    });
    await TEST.clearChannels();
  });

  it('nothing given', async () => {
    await TEST.ts.db.Members.query()
      .where({ discord_id: '128' })
      .patch({ is_mod: 1 });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!fixdiscuss',
        channel: TEST.ts.channels.modChannel,
        discord_id: '128',
      }),
      await TEST.mockMessage('error.noCode', { type: 'userError' }),
    );
  });

  it('code not found', async () => {
    await TEST.ts.db.Members.query()
      .where({ discord_id: '128' })
      .patch({ is_mod: 1 });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!fixdiscuss yyy-yyy-yyy',
        channel: TEST.ts.channels.modChannel,
        discord_id: '128',
      }),
      "The code `YYY-YYY-YYY` was not found in AutoTest's list. ",
    );
  });

  it('not mod', async () => {
    assert.lengthOf(
      await TEST.mockBotSend({
        cmd: '!fixdiscuss xxx-xxx-xx3',
        channel: 'general',
        waitFor: 100,
        discord_id: '64',
      }),
      22,
    );
  });

  // Doesn't work anymore for pending reuploads
  /* it("create pending reupload fix channel if doesn't exist", async () => {
    await TEST.ts.db.Members.query()
      .where({ discord_id: '128' })
      .patch({ is_mod: 1 });
    await TEST.mockBotSend({
      cmd: '!fixdiscuss xxx-xxx-xx3',
      channel: 'general',
      discord_id: '128',
    });

    assert.exists(
      await TEST.findChannel({
        name: 'XXX-XXX-XX3',
        parentID: TEST.ts.channels.levelAuditCategory,
      }),
      'a pending fix reupload channel should be created',
    );
  });

  it('fixdiscuss pending channel', async () => {
    await TEST.ts.db.Members.query()
      .where({ discord_id: '128' })
      .patch({ is_mod: 1 });
    await TEST.mockBotSend({
      cmd: '!fixdiscuss xxx-xxx-xx1',
      channel: 'general',
      discord_id: '128',
    });

    assert.exists(
      await TEST.findChannel({
        name: 'XXX-XXX-XX1',
        parent: TEST.ts.channels.levelDiscussionCategory,
      }),
      'a pending channel should be created',
    );
  });

  it('check in in discussion channel channel', async () => {
    await TEST.createChannel({
      name: 'XXX-XXX-XX3',
      parent: TEST.ts.channels.levelDiscussionCategory,
    });

    await TEST.ts.db.Members.query()
      .where({ discord_id: '128' })
      .patch({ is_mod: 1 });
    await TEST.mockBotSend({
      cmd: '!fixdiscuss',
      channel: 'xxx-xxx-xx3',
      discord_id: '128',
    });

    assert.exists(
      await TEST.findChannel({
        name: 'XXX-XXX-XX3',
        parentID: TEST.ts.channels.levelAuditCategory,
      }),
      'a pending fix reupload channel should be created',
    );
  });
  */
});
