describe('!rerate', function () {
  beforeEach(async () => {
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
          name: 'Other',
          discord_id: '512',
        },
      ],
      Levels: [
        {
          level_name: 'approved level',
          creator: 2,
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
        },
        {
          level_name: 'pending level',
          creator: 2,
          code: 'XXX-XXX-XX2',
          status: 0,
          difficulty: 0,
        },
        {
          level_name: 'user removed level',
          creator: 2,
          code: 'XXX-XXX-XX3',
          status: TEST.ts.LEVEL_STATUS.USER_REMOVED,
          difficulty: 0,
        },
      ],
    });
  });

  it('Not in mod channel', async function () {
    assert.lengthOf(
      await TEST.mockBotSend({
        cmd: '!rerate',
        channel: 'general',
        waitFor: 100,
        discord_id: '256',
      }),
      31,
    );
  });
  // waitFor:100,
  it('No code', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!rerate',
        channel: TEST.ts.channels.modChannel,
        discord_id: '128',
      }),
      "You didn't enter a level code. ",
    );
  });

  it('No difficulty', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!rerate XXX-XXX-XXX',
        channel: TEST.ts.channels.modChannel,
        discord_id: '128',
      }),
      'Missing parameter. You have to enter something here. ',
    );
  });

  it('No reason', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!rerate XXX-XXX-XXX 2',
        channel: TEST.ts.channels.modChannel,
        discord_id: '128',
      }),
      'Missing parameter. You have to enter something here. ',
    );
  });

  it('wrong code', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!rerate XXX-XXX-XX 2 reason',
        channel: TEST.ts.channels.modChannel,
        discord_id: '128',
      }),
      'This is not a valid level code. ',
    );
  });

  it('invalid difficulty', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!rerate XXX-XXX-XXX -1 long reason',
        channel: TEST.ts.channels.modChannel,
        discord_id: '128',
      }),
      'Invalid difficulty format! ',
    );
  });

  it('success', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!rerate XXX-XXX-XXX 2 long reason',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    assert.equal(result[1].title, 'approved level (XXX-XXX-XXX)');
    assert.equal(
      result[1].author.name,
      'Difficulty rating updated from 1.0 - 2.0',
    );
    assert.equal(result[2], 'Difficulty was successfully changed!');
  });

  it('reason length=800', async function () {
    const result = await TEST.mockBotSend({
      cmd:
        '!rerate XXX-XXX-XXX 2 Lorem ipsum dolor sit amet, consectetur adipiscing elit. In ut enim rhoncus, aliquet sem sed, maximus quam. Ut sed enim consectetur erat posuere semper. Maecenas a augue a massa iaculis lacinia sit amet eget turpis. Ut hendrerit ullamcorper lacus, eget vulputate eros porttitor non. Pellentesque maximus laoreet diam, sit amet porta nisi. Proin sed dignissim ligula, vitae lacinia quam. Quisque ac augue ut risus lacinia ultrices. Cras vel luctus nisl, vel mattis sapien. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras odio dui, faucibus a nibh vel, porttitor dignissim leo. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Curabitur ac congue elit, quis pulvinar turpis. Nunc feugiat elit nec eros lobortis, in aliquam nibh sollicitudin blandit.',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    assert.equal(result[1].title, 'approved level (XXX-XXX-XXX)');
    assert.equal(
      result[1].author.name,
      'Difficulty rating updated from 1.0 - 2.0',
    );
    assert.equal(result[2], 'Difficulty was successfully changed!');
  });

  it('reason length=801', async function () {
    const result = await TEST.mockBotSend({
      cmd:
        '!rerate XXX-XXX-XXX 2 "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In ut enim rhooncus, aliquet sem sed, maximus quam. Ut sed enim consectetur erat posuere semper. Maecenas a augue a massa iaculis lacinia sit amet eget turpis. Ut hendrerit ullamcorper lacus, eget vulputate eros porttitor non. Pellentesque maximus laoreet diam, sit amet porta nisi. Proin sed dignissim ligula, vitae lacinia quam. Quisque ac augue ut risus lacinia ultrices. Cras vel luctus nisl, vel mattis sapien. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras odio dui, faucibus a nibh vel, porttitor dignissim leo. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Curabitur ac congue elit, quis pulvinar turpis. Nunc feugiat elit nec eros lobortis, in aliquam nibh sollicitudin blandit."',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    // console.log(result);
    assert.equal(
      result,
      'The text you entered is too long for this command, a maximum of 800 characters are allowed here. ',
    );
  });

  it('already that difficulty @curr', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!rerate XXX-XXX-XXX 1 long reason',
        channel: TEST.ts.channels.modChannel,
        discord_id: '128',
      }),
      '"approved level" is already rated 1 ',
    );
  });

  it('level not approved', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!rerate XXX-XXX-XX3 1 long reason',
        channel: TEST.ts.channels.modChannel,
        discord_id: '128',
      }),
      '"user removed level" by Creator has already been removed ',
    );
  });
});
