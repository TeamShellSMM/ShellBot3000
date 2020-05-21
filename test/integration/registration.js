describe('registration', function () {
  before(async () => {
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
          level_name: 'EZ GG',
          creator: 2,
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
        },
      ],
    });
  });

  it('!points not registered', async function () {
    assert.deepEqual(
      await TEST.mockBotSend({
        cmd: '!points',
        channel: 'general',
        discord_id: '512',
      }),
      await TEST.mockMessage(
        'error.notRegistered',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });
  it('!points for banned', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!points',
      channel: 'general',
      discord_id: '-1',
    });
    assert.deepEqual(
      result,
      await TEST.mockMessage('error.userBanned', {
        type: 'userError',
      }),
    );
  });
  it('!register already', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!register',
      channel: 'general',
      discord_id: '256',
    });
    assert.deepEqual(
      result,
      await TEST.mockMessage(
        'register.already',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it('!register banned', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!register',
        channel: 'general',
        discord_id: '-1',
      }),
      await TEST.mockMessage('error.userBanned', {
        type: 'userError',
      }),
    );
  });

  it('try registering as someone else', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!register Mod',
      channel: 'general',
      discord_id: '512',
    });
    assert.deepEqual(
      result,
      await TEST.mockMessage(
        'register.nameTaken',
        { type: 'userError' },
        { name: 'Mod' },
      ),
    );
  });

  it('registering with special discord strings, <@at>=reject', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!register <@80351110224678912>',
      channel: 'general',
      discord_id: '512',
    });
    assert.deepEqual(
      result,
      await TEST.mockMessage('error.specialDiscordString', {
        type: 'userError',
      }),
    );
  });

  it('registering with special discord strings, <#channel>=reject', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!register <#80351110224678912>',
      channel: 'general',
      discord_id: '512',
    });
    assert.deepEqual(
      result,
      await TEST.mockMessage('error.specialDiscordString', {
        type: 'userError',
      }),
    );
  });

  it('succesful registration without argument', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!register',
      channel: 'general',
      discord_id: '512',
    });
    const dbResult = await TEST.ts.db.Members.query().where({
      discord_id: '512',
    });
    assert.lengthOf(dbResult, 1, 'Should only have one item');
    assert.equal(
      dbResult[0].name,
      TEST.client.user.username,
      'name is stored',
    );
    assert.deepEqual(
      result,
      await TEST.mockMessage(
        'register.success',
        {},
        { name: TEST.client.user.username },
      ),
      'message is correct',
    );
  });
  it('succesful registration with supplied nickname', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!register my_name',
      channel: 'general',
      discord_id: '1024',
    });
    const dbResult = await TEST.ts.db.Members.query().where({
      discord_id: '1024',
    });
    assert.lengthOf(dbResult, 1, 'Should only have one item');
    assert.equal(dbResult[0].name, 'my_name', 'name is stored');
    assert.deepEqual(
      result,
      await TEST.mockMessage(
        'register.success',
        {},
        { name: 'my_name' },
      ),
    );
  });
  let otp;
  let discordId;
  it('!login, check OTP', async function () {
    discordId = '1024';
    const result = await TEST.mockBotSend({
      cmd: '!login',
      channel: 'general',
      discord_id: '1024',
    });
    const dbResult = await TEST.ts.db.Tokens.query().where({
      discord_id: discordId,
    });
    assert.lengthOf(dbResult, 1, 'Should only have one item');
    assert.equal(
      dbResult[0].authenticated,
      0,
      "shouldn't be logged in yet",
    );
    assert.lengthOf(dbResult[0].token, 16, 'check length of token');
    otp = dbResult[0].token;
    assert.deepEqual(
      result,
      await TEST.mockMessage(
        'login.reply',
        { discord_id: discordId, type: 'registeredSuccess' },
        { loginLink: TEST.ts.generateLoginLink(otp) },
      ),
    );
  });

  it('!login cant dm', async function () {
    const dm = sinon.stub(TEST.ts.discord, 'dm');
    dm.throws({ code: 50007 });
    const result = await TEST.mockBotSend({
      cmd: '!login',
      channel: 'general',
      discord_id: '256',
    });
    sinon.assert.calledOnce(dm);
    assert.equal(
      result,
      " It seems the bot couldn't send you a direct message with the login link, are you maybe blocking direct messages from non-friends? You can try this command again if you change your discord settings. ",
    );
    dm.restore();
  });

  it('!login unknown error', async function () {
    const dm = sinon.stub(TEST.ts.discord, 'dm');
    dm.throws(new Error('unknown'));
    const result = await TEST.mockBotSend({
      cmd: '!login',
      channel: 'general',
      discord_id: '256',
    });
    sinon.assert.calledOnce(dm);
    assert.equal(result, 'something went wrong buzzyS');
    dm.restore();
  });

  it('POST /json/login no data', async function () {
    const { body } = await TEST.request(app)
      .post('/json/login')
      .expect('Content-Type', /json/)
      .expect(200);
    const dbResult = await TEST.ts.db.Tokens.query().where({
      discord_id: discordId,
    });
    assert.lengthOf(dbResult, 1, 'Should only have one item');
    assert.equal(
      dbResult[0].authenticated,
      0,
      "shouldn't be logged in yet",
    );
    assert.lengthOf(dbResult[0].token, 16, 'check length of token');
    otp = dbResult[0].token;
    assert.deepEqual(
      body,
      { status: 'error', message: TEST.TS.message('api.noslug') },
      'Error with no slug',
    );
  });

  let token;
  it('POST /json/login succesful', async function () {
    TEST.acceptReply();
    await TEST.ts.getUser(discordId);
    const { body } = await TEST.request(app)
      .post('/json/login')
      .send({ url_slug: TEST.ts.url_slug, otp })
      .expect('Content-Type', /json/)
      .expect(200);
    token = await TEST.ts.db.Tokens.query().where({
      discord_id: discordId,
    });
    assert.lengthOf(token, 1, 'only has one record');
    token = token[0].token;
    assert.equal(body.status, 'logged_in');
    assert.equal(body.token, token);
  });

  it('POST /json registered', async function () {
    await TEST.ts.getUser(discordId);
    const { body } = await TEST.request(app)
      .post('/json')
      .send({ url_slug: TEST.ts.url_slug, token })
      .expect('Content-Type', /json/)
      .expect(200);
    // For now we stop comparing these
    // TODO: make it work with actual dates
    assert.lengthOf(body.levels, 1, 'one levels in db');

    delete body.levels[0].created_at;
    delete body.levels[0].id;

    // not really login info. should put registered flag or something
    assert.equal(body.levels[0].code, 'XXX-XXX-XXX');
    assert.equal(body.levels[0].level_name, 'EZ GG');
    assert.equal(body.levels[0].creator, 'Creator');
  });
});
