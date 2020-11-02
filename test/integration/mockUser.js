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
        {
          name: 'Bot',
          discord_id: TEST.bot_id,
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
        discord_id: TEST.bot_id,
      }),
      'You have to enter a valid member name. ',
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
        discord_id: TEST.bot_id,
      }),
      'No member with the name "unknown" was found in the members list. ',
    );
  });

  it('Already target', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!mockUser Bot',
        channel: 'general',
        discord_id: TEST.bot_id,
      }),
      "You're already them ",
    );
  });

  it('Mock successful', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!mockUser Creator',
        channel: 'general',
        discord_id: TEST.bot_id,
      }),
      "You're now Creator. Identity theft is not a joke, Jim!",
    );
  });
});
