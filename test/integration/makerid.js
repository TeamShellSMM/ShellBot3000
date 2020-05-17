describe('!makerid', function () {
  beforeEach(async () => {
    await TEST.setupData({
      Members: [
        {
          name: 'Creator',
          discord_id: '64',
          maker_id: 'xxx-xxx-xx1',
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
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!makerid',
        channel: 'general',
        discord_id: '128',
      }),
      "You didn't provide any maker code ",
    );
  });

  it('no name', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!makerid xxx-xxx-xxx',
        channel: 'general',
        discord_id: '128',
      }),
      "You didn't provide your maker name ",
    );
  });

  it('invalid code', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!makerid xx-xxx-xxx myname',
        channel: 'general',
        discord_id: '128',
      }),
      '`XX-XXX-XXX` is not a valid maker id ',
    );
  });

  it('already used', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!makerid xxx-xxx-xx1 myname',
        channel: 'general',
        discord_id: '128',
      }),
      "`XXX-XXX-XX1 is already being used by 'Creator'  ",
    );
  });

  it('success', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!makerid xxx-xxx-xxx myname',
        channel: 'general',
        discord_id: '128',
      }),
      '<@128> You have updated your maker-id to XXX-XXX-XXX and maker-name to myname ',
    );
  });
});
