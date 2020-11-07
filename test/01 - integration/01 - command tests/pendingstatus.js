describe('!pendingstatus', function () {
  before(async () => {
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
      ],
    });
  });

  it('creator', async () => {
    await TEST.ts.db.Levels.query()
      .patch({
        approves: 1,
        rejects: 1,
        want_fixes: 1,
      })
      .where({ code: 'XXX-XXX-XXX' });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!pending',
        channel: 'general',
        discord_id: '64',
      }),
      '<@64> \nYour Pending Levels:```XXX-XXX-XXX - "need fix reupload":\n •1 approval,1 rejects,1 fix request\n\nXXX-XXX-XX3 - "approved reuploaded":\n •No votes has been cast yet\n\nXXX-XXX-XX4 - "need fixreject":\n •No votes has been cast yet\n\n```',
    );
  });

  it('mod', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!pending',
        channel: 'general',
        discord_id: '128',
      }),
      'You have no levels pending ',
    );
  });
});
