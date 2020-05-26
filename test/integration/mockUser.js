describe('!mockUser', function () {
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
    });
    await TEST.clearChannels();
  });

  it('nothing given', async () => {
    await TEST.ts.db.Members.query()
      .where({ discord_id: '128' })
      .patch({ is_mod: 1 });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!mockUser',
        channel: 'general',
        discord_id: '128',
      }),
      "You didn't give any names ",
    );
  });

  it('member not found', async () => {
    await TEST.ts.db.Members.query()
      .where({ discord_id: '128' })
      .patch({ is_mod: 1 });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!mockUser unknown',
        channel: 'general',
        discord_id: '128',
      }),
      'No user found ',
    );
  });

  it('Already target', async () => {
    await TEST.ts.db.Members.query()
      .where({ discord_id: '128' })
      .patch({ is_mod: 1 });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!mockUser Mod1',
        channel: 'general',
        discord_id: '128',
      }),
      "You're already them ",
    );
  });

  it('Mock successful', async () => {
    await TEST.ts.db.Members.query()
      .where({ discord_id: '128' })
      .patch({ is_mod: 1 });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!mockUser Creator',
        channel: 'general',
        discord_id: '128',
      }),
      "You're now Creator. Identity theft is not a joke, Jim!",
    );
  });
});
