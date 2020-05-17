describe('!rename', function () {
  before(async () => {
    await TEST.setupData({
      Members: [
        {
          name: 'Mod',
          discord_id: '128',
          is_mod: 1,
        },
        {
          name: 'Creator',
          discord_id: '256',
        },
        {
          name: 'Player',
          discord_id: '512',
        },
      ],
      Levels: [
        {
          level_name: 'level1',
          creator: 2,
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
        },
        {
          level_name: 'level2',
          creator: 2,
          code: 'XXX-XXX-XX2',
          status: 0,
          difficulty: 0,
        },
        {
          level_name: 'level3',
          creator: 2,
          code: 'XXX-XXX-XX3',
          status: 1,
          difficulty: 1,
        },
      ],
    });
  });

  it('no level code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!rename',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'error.noCode',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });
  it('no level name', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!rename xxx-xxx-xxx',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(result, "You didn't give a new level name ");
  });

  it('no code', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!rename new long name',
        channel: 'general',
        discord_id: '256',
      }),
      "The code `NEW` was not found in AutoTest's list. ",
    );
  });

  it('level name with special discord strings, <@at>=reject', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!rename XXX-XXX-XXX house of <@80351110224678912>',
        channel: 'general',
        discord_id: '256',
      }),
      await TEST.mockMessage('error.specialDiscordString', {
        type: 'userError',
      }),
    );
  });

  it('other user tries to rename a level', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!rename XXX-XXX-XXX new name',
        channel: 'general',
        discord_id: '512',
      }),
      "You can't rename 'level1' by Creator ",
    );
  });

  it('same level name', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!rename XXX-XXX-XXX level1',
        channel: 'general',
        discord_id: '256',
      }),
      'Level name is already "level1" ',
    );
  });

  it('successful', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!rename xxx-xxx-xxx new long name',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      '<@256> The level level1" (XXX-XXX-XXX) has been renamed to "new long name" ',
    );
    const level = await TEST.ts
      .getLevels()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    assert.equal(level.level_name, 'new long name');
  });
});
