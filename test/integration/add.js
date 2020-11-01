describe('!add', function () {
  beforeEach(async () => {
    await TEST.setupData({
      Members: [
        {
          name: 'Mod',
          discord_id: '128',
        },
        {
          name: 'Creator',
          discord_id: '256',
        },
        {
          name: 'Banned',
          discord_id: '-1',
          is_banned: 1,
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
      cmd: '!add',
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
  it('no game style', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!add XXX-XXX-XXX',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      await TEST.mockMessage('add.missingGameStyle', {
        type: 'userError',
      }),
    );
  });
  it('no level name', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!add xxx-xxx-xxx smw',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'error.missingParameter',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });
  it('invalid code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!add xx-xxx-xxx smw',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'error.invalidCode',
        { type: 'userError' },
        { code: 'XX-XXX-XXX' },
      ),
    );
  });

  it('adding existing', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!add xxx-xxx-xxx smw long name',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'add.levelExisting',
        { type: 'userError' },
        {
          level: {
            level_name: 'level1',
            code: 'XXX-XXX-XXX',
            creator: 'Creator',
          },
        },
      ),
    );
  });
  it('no code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!add smw long name',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'error.invalidCode',
        { type: 'userError' },
        {
          level_name: '',
          code: 'XXX-XXX-XXX',
          creator: 'Creator',
        },
      ),
    );
  });

  it('successful', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!add XXX-XXX-XX4 smw long name',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'add.success',
        { type: 'registeredSuccess', discord_id: '256' },
        {
          level_name: 'long name',
          code: 'XXX-XXX-XX4',
        },
      ),
    );
    const levels = await TEST.ts.getLevels();
    assert.lengthOf(levels, 4);
    assert.equal(levels[3].code, 'XXX-XXX-XX4');
    assert.equal(levels[3].creator, 'Creator');
    assert.equal(levels[3].status, 0);
    assert.equal(levels[3].difficulty, 0);
  });

  it('adding level name with special discord strings, <@at>=reject', async function () {
    assert.deepEqual(
      await TEST.mockBotSend({
        cmd: '!add XXX-XXX-XX4 smw house of <@80351110224678912>',
        channel: 'general',
        discord_id: '512',
      }),
      await TEST.mockMessage('error.specialDiscordString', {
        type: 'userError',
      }),
    );
  });

  it('space after the !', async function () {
    assert.deepEqual(
      await TEST.mockBotSend({
        cmd: '! add XXX-XXX-XX4 smw this is some long text',
        channel: 'general',
        discord_id: '256',
      }),
      '<@256> The level this is some long text (XXX-XXX-XX4) has been added ',
    );
  });

  it('no points', async function () {
    await TEST.clearTable('levels');
    TEST.ts.teamVariables['Minimum Point'] = 10;
    await TEST.ts.recalculateAfterUpdate();
    const result = await TEST.mockBotSend({
      cmd: '!add XXX-XXX-XX4 smw long name',
      channel: 'general',
      discord_id: '256',
    });
    const player = await TEST.ts.getUser('256');
    assert.equal(
      result,
      await TEST.mockMessage(
        'points.cantUpload',
        { type: 'userError', discord_id: '256' },
        {
          points_needed: player.earned_points.pointsNeeded,
        },
      ),
    );
    const levels = await TEST.ts.getLevels();
    assert.lengthOf(levels, 0);
  });

  it('Submit SMM1 code with allowSMM1 flag off', async function () {
    TEST.ts.teamVariables.allowSMM1 = null;
    TEST.ts.teamVariables['Minimum Point'] = 0;
    const result = await TEST.mockBotSend({
      cmd: '!add 0791-0000-03DD-2D52 smw The Ultimate Road of Shell',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'error.invalidCode',
        { type: 'userError' },
        { code: '0791-0000-03DD-2D52' },
      ),
    );
  });

  it('Submit SMM1 code with allowSMM1 flag on #dev', async function () {
    TEST.ts.teamVariables.allowSMM1 = 'true';
    const result = await TEST.mockBotSend({
      cmd: '!add 0791-0000-03DD-2D52 smw The Ultimate Road of Shell',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'add.success',
        { type: 'registeredSuccess', discord_id: '128' },
        {
          level_name: 'The Ultimate Road of Shell',
          code: '0791-0000-03DD-2D52',
        },
      ),
    );
    const level = await TEST.ts
      .getLevels()
      .where({ code: '0791-0000-03DD-2D52' })
      .first();
    assert.exists(level);
    assert.equal(level.code, '0791-0000-03DD-2D52');
    assert.equal(level.creator, 'Mod');
    assert.equal(level.status, 0);
    assert.equal(level.difficulty, 0);
  });
});
