describe('!requestrerate', function () {
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
      ],
      PendingVotes: [],
    });
    await TEST.ts.load();
  });

  it('request rerate approved level', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!requestrerate XXX-XXX-XX5 needs to be 1.5',
      channel: 'general',
      discord_id: '64',
    });

    assert.equal(
      result[2],
      "Your rerate request was received, we'll get back to you in a bit!",
    );
  });

  it('request rerate non-approved level', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!requestrerate XXX-XXX-XX6 needs to be 1.5',
        channel: 'general',
        discord_id: '64',
      }),
      'This level is not an approved level. ',
    );
  });

  it('request rerate missing code and reason', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!requestrerate',
        channel: 'general',
        discord_id: '64',
      }),
      "You didn't enter a level code. ",
    );
  });

  it('request rerate missing reason', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!requestrerate XXX-XXX-XX5',
        channel: 'general',
        discord_id: '64',
      }),
      'Missing parameter. You have to enter something here. ',
    );
  });
});
