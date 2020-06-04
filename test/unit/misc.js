const DiscordWrapper = require('../../src/DiscordWrapper');

describe('misc-unit', function () {
  beforeEach(async () => {
    const initData = {
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
          name: 'Another Creator',
          discord_id: '256',
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
          status: TEST.ts.LEVEL_STATUS.REUPLOADED,
          difficulty: 0,
        },
        {
          level_name: 'User removed',
          creator: 1,
          code: 'XXX-XXX-X11',
          status: TEST.ts.LEVEL_STATUS.USER_REMOVED,
          difficulty: 2,
        },
      ],
    };

    await TEST.setupData(initData);
    TEST.ts.teamVariables['Minimum Point'] = 0;
    TEST.ts.teamVariables['New Level'] = 0;
  });

  it('new TS no arguments', async function () {
    assert.throws(
      () => new TEST.TS(),
      Error,
      'No guild_id was passed to TS()',
    );
  });

  it('new TS no guild found', async function () {
    assert.throws(
      () => new TEST.TS('guild_id', DiscordWrapper),
      Error,
      'Cannot find discord server. Invalid guild_id or ShellBot is not on this server.',
    );
  });

  it('Check TS.team no guild_id', async function () {
    assert.throws(
      () => TEST.TS.teams('unregistered_guild_id'),
      Error,
      "This team, with guild id unregistered_guild_id has not yet setup it's config, buzzyS",
    );
  });

  it('TS.message unfound string', async function () {
    assert.throws(
      () => TEST.TS.message('unknown_string'),
      Error,
      '"unknown_string" message string was not found in ts.message',
    );
  });

  it('ts.message unfound string', async function () {
    assert.throws(
      () => TEST.ts.message('unknown_string'),
      Error,
      '"unknown_string" message string was not found in ts.message',
    );
  });

  it('TS.teamFromUrl unfound slug', async function () {
    assert.notExists(TEST.TS.teamFromUrl('unknown_string'));
  });

  it('ts.discussionChannel no channel name', async () => {
    await TEST.ts.discussionChannel().catch((e) => {
      assert(e instanceof TypeError);
      assert.equal(e.message, 'undefined channel_name');
    });
  });

  it('ts.discussionChannel no parent category', async () => {
    await TEST.ts.discussionChannel('chanel-name').catch((e) => {
      assert.instanceOf(e, TypeError);
      assert.equal(e.message, 'undefined parentID');
    });
  });

  it('ts.get_USER no discord_id ', async () => {
    const user = await TEST.ts.getUser().catch((e) => {
      assert.instanceOf(e, TEST.TS.UserError);
      assert.equal(e.message, "We couldn't find your discord id");
    });
    assert.notExists(user);
  });

  it('ts.checkForAgreement no arguments', async () => {
    assert.isFalse(TEST.ts.checkForAgreement());
  });

  it('ts.clear no argument', async () => {
    const reply = await TEST.ts.clear().catch((e) => {
      assert.instanceOf(e, TEST.TS.UserError);
      assert.equal(e.message, "We couldn't find your discord id");
    });
    assert.notExists(reply);
  });

  it('ts.commandPassedBoolean invalid value', async () => {
    assert.isNull(await TEST.ts.commandPassedBoolean('invalid'));
    assert.isNull(await TEST.ts.commandPassedBoolean(''));
  });

  it('ts.clear no argument', async () => {
    const reply = await TEST.ts
      .clear({ discord_id: '256', difficulty: '' })
      .catch((e) => {
        assert.instanceOf(e, TEST.TS.UserError);
        assert.equal(
          e.message,
          'There were no arguments in the request',
        );
      });
    assert.notExists(reply);
  });

  it('ts.updatePinned no parameters', async () => {
    await TEST.ts.discord.updatePinned().catch((e) => {
      assert.instanceOf(e, TypeError);
      assert.equal(e.message, 'channel name undefined');
    });
    await TEST.ts.discord.updatePinned('channel-name').catch((e) => {
      assert.instanceOf(e, TypeError);
      assert.equal(e.message, 'embed not defined', 'here2');
    });
  });

  it('ts.getWebUserError not user error', async () => {
    assert.deepEqual(
      await TEST.ts.getWebUserErrorMsg(new Error('not user error')),
      { status: 'error', message: 'something went wrong buzzyS' },
    );
  });

  it('ts.getUserError not user error', async () => {
    assert.deepEqual(
      await TEST.ts.getUserErrorMsg(new Error('not user error'), {
        content: 'mock',
        author: {
          username: 'mock',
        },
        channel: {
          id: 1,
        },
      }),
      'something went wrong buzzyS',
    );
  });

  it('ts.getExistingLevel removed', async () => {
    const level = await TEST.ts
      .getExistingLevel('XXX-XXX-XX5')
      .catch((e) => {
        assert.instanceOf(e, TEST.TS.UserError);
        assert.equal(
          e.message,
          "The level 'removed level'  has been removed from AutoTest's list",
        );
      });
    assert.notExists(level);
  });

  it('ts.getExistingLevel wrong code, with suggestion', async () => {
    const level = await TEST.ts
      .getExistingLevel('XXX-XXX-XX')
      .catch((e) => {
        assert.instanceOf(e, TEST.TS.UserError);
        assert.equal(
          e.message,
          'The code `XXX-XXX-XX` was not found in AutoTest\'s list. Did you mean:```\nXXX-XXX-XX1 - "pending level" by Creator```',
        );
      });
    assert.notExists(level);
  });

  it('ts.modOnly devs', async () => {
    const oldDevs = TEST.ts.devs;
    TEST.ts.devs = ['123', '456'];
    assert.isTrue(await TEST.ts.modOnly('123'));
    assert.isTrue(await TEST.ts.modOnly('456'));
    assert.isFalse(await TEST.ts.modOnly('unknown'));
    TEST.ts.devs = oldDevs;
  });

  it('ts.getExistingLevel wrong code, with suggestion', async () => {
    const level = await TEST.ts.getExistingLevel().catch((e) => {
      assert.instanceOf(e, TEST.TS.UserError);
      assert.equal(e.message, 'You did not give a level code');
    });
    assert.notExists(level);
  });

  it('ts.embedAddLongField', async () => {
    const level = await TEST.ts.getExistingLevel('XXX-XXX-XX2');
    const embed = await TEST.ts.levelEmbed(level);
    TEST.ts.embedAddLongField(
      embed,
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent id ligula mauris. Cras vulputate ullamcorper tortor, a congue ante aliquet venenatis. Pellentesque pulvinar ultrices eros sed blandit. Nullam vulputate efficitur libero, quis commodo diam malesuada id. Nulla posuere ut mauris in pellentesque. Vivamus volutpat urna ut tincidunt tincidunt. Donec gravida posuere odio, rhoncus mollis ligula accumsan non. Proin ut pellentesque nunc. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur in vulputate metus. Maecenas auctor imperdiet mollis. Aenean vitae luctus sapien. Nunc pharetra quis ligula et viverra. Nunc quis dolor luctus, molestie ex sed, porttitor ligula. Suspendisse non pharetra dolor. Praesent justo lorem, imperdiet et dictum et, vestibulum quis lacus. Nulla sollicitudin mollis lacus a efficitur. Etiam tristique varius nibh, id venenatis erat interdum eu. Curabitur pharetra risus sit amet dictum condimentum. Phasellus neque purus, ullamcorper id lectus ac, tempus rhoncus felis. Praesent nec est neque. Sed tincidunt mauris id est placerat scelerisque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Aliquam eu sagittis lectus. Vestibulum quis nibh lacinia, scelerisque quam ut, vestibulum velit. Nulla eu viverra massa. Phasellus sed elementum est, eu tristique mauris. In dapibus urna metus, dapibus porttitor nunc elementum ac.',
    );
    assert.lengthOf(embed.fields, 2);
  });

  it('ts.embedAddLongField empty', async () => {
    const embed = TEST.ts.discord.embed();
    TEST.ts.embedAddLongField(embed);
    assert.lengthOf(embed.fields, 0);
  });

  it('ts.discussionChannel old and new exists @curr', async () => {
    const channel = sinon.stub(TEST.ts.discord, 'channel');
    const removeChannel = sinon.stub(
      TEST.ts.discord,
      'removeChannel',
    );
    const createChannel = sinon.stub(
      TEST.ts.discord,
      'createChannel',
    );
    const setChannelParent = sinon.stub(
      TEST.ts.discord,
      'setChannelParent',
    );
    channel.returns('true');
    await TEST.ts.discussionChannel(
      'newChannel',
      'parent',
      'oldChannel',
    );

    sinon.assert.calledOnce(removeChannel);
    sinon.assert.calledWith(
      removeChannel,
      'oldChannel',
      'duplicate channel',
    );
    sinon.assert.notCalled(createChannel);
    sinon.assert.calledOnce(setChannelParent);

    sinon.restore();
  });

  it('ts.getEmoteUrl no arguments', async () => {
    assert.equal(await TEST.ts.getEmoteUrl(), '');
  });

  it('ts.validCode no arguments', async () => {
    assert.isFalse(await TEST.ts.validCode());
  });

  it('ts.is_smm2 no arguments', async () => {
    assert.isFalse(await TEST.ts.is_smm2());
  });

  it('ts.is_smm1 no arguments', async () => {
    assert.isFalse(await TEST.ts.is_smm1());
  });

  it('ts.getSettings', async () => {
    await assert.deepInclude(await TEST.ts.getSettings('settings'), {
      TeamName: 'AutoTest',
      BotName: 'Autobot',
    });
  });

  it('ts.parseCommand', async () => {
    const result = TEST.ts.parseCommand({
      content: '!addvid xxx-xxx-xxx\n val1,val2',
    });
    assert.deepEqual(result, {
      command: 'addvid',
      arguments: ['xxx-xxx-xxx', 'val1,val2'],
      argumentString: 'xxx-xxx-xxx val1,val2',
    });
  });

  it('ts.addTags() not string or array', async () => {
    const result = await TEST.ts
      .addTags({ name: 'general' })
      .catch((e) => {
        assert.instanceOf(e, TypeError);
        assert.equal(e.message, 'not a string or array of strings');
      });
    assert.notExists(result);
  });

  it('ts.randomLevel invalid difficulty', async () => {
    const level = await TEST.ts
      .randomLevel({
        minDifficulty: 'invalid',
      })
      .catch((e) => {
        assert.instanceOf(e, TEST.TS.UserError);
        assert.equal(
          e.message,
          "You didn't specify a valid difficulty",
        );
      });
    assert.notExists(level);
  });

  it('ts.randomLevel invalid difficulty with max difficulty', async () => {
    const level = await TEST.ts
      .randomLevel({
        minDifficulty: 'invalid',
        maxDifficulty: 5,
      })
      .catch((e) => {
        assert.instanceOf(e, TEST.TS.UserError);
        assert.equal(
          e.message,
          "You didn't specify a valid minimum difficulty",
        );
      });
    assert.notExists(level);
  });
  it('ts.randomLevel invalid max difficulty', async () => {
    const level = await TEST.ts
      .randomLevel({
        minDifficulty: 1,
        maxDifficulty: 'invalid',
      })
      .catch((e) => {
        assert.instanceOf(e, TEST.TS.UserError);
        assert.equal(
          e.message,
          "You didn't specify a valid maximum difficulty",
        );
      });
    assert.notExists(level);
  });

  it('no arguments deleteDiscussionChannel', async () => {
    const reply = await TEST.ts
      .deleteDiscussionChannel()
      .catch((e) => {
        assert.instanceOf(e, Error);
        assert.equal(
          e.message,
          'No code given to this.deleteDiscussionChannel',
        );
      });
    assert.notExists(reply);
  });

  it('no arguments invalid code', async () => {
    const reply = await TEST.ts.deleteDiscussionChannel('xxx-xxx-xx');
    assert.notExists(reply);
  });

  it('ts.judge not pending level', async () => {
    const reply = await TEST.ts.judge('XXX-XXX-XX5').catch((e) => {
      assert.instanceOf(e, TEST.TS.UserError);
      assert.equal(
        e.message,
        "The level 'removed level'  has been removed from AutoTest's list",
      );
    });
    assert.notExists(reply);
  });

  it('ts.generateOTP multiple hit', async () => {
    assert.lengthOf(TEST.ts.generateToken(), 16);
    await TEST.ts.db.Tokens.query().insert({
      discord_id: '128',
      token: '123',
    });
    const token = sinon.stub(TEST.ts, 'generateToken');
    token.onCall(0).returns('123');
    token.onCall(1).returns('456');
    const newToken = await TEST.ts.generateUniqueToken();
    assert.equal(newToken, '456');
  });

  it('ts.secureData and verifyData', async () => {
    const secureData = TEST.ts.secureData([
      { id: 1, value: 1 },
      { id: 2, value: 1 },
      { id: 3, value: 1 },
      { value: 4 },
    ]);
    const verifiedData = TEST.ts.verifyData(secureData);
    assert.lengthOf(verifiedData, 4);
    try {
      TEST.ts.verifyData([
        { id: 1, value: 1 },
        { id: 2, value: 1 },
        { id: 3, value: 1 },
        { value: 4 },
      ]);
    } catch (error) {
      assert.instanceOf(error, TEST.ts.UserError);
      assert.equal(
        error.msg,
        'There was something wrong with the secure tokens. Please try again',
      );
    }
    try {
      secureData[0].id = 4;
      TEST.ts.verifyData(secureData);
    } catch (error) {
      assert.instanceOf(error, TEST.ts.UserError);
      assert.equal(
        error.msg,
        'There was something wrong with the secure tokens. Please try again',
      );
    }
    try {
      secureData[0].SECURE_TOKEN = 'wrong token';
      TEST.ts.verifyData(secureData);
    } catch (error) {
      assert.instanceOf(error, TEST.ts.UserError);
      assert.equal(
        error.msg,
        'There was something wrong with the secure tokens. Please try again',
      );
    }
  });

  it('ts.checkBearerToken', async () => {
    try {
      assert.notExists(await TEST.ts.checkBearerToken());
    } catch (error) {
      assert.instanceOf(error, TEST.ts.UserError);
      assert.equal(error.msg, 'No token sent');
    }
  });

  it('ts.checkBearerToken', async () => {
    try {
      assert.notExists(
        await TEST.ts.checkBearerToken('unknown_string'),
      );
    } catch (error) {
      assert.instanceOf(error, TEST.ts.UserError);
      assert.equal(error.msg, 'Authentication error');
    }
  });

  it('ts.checkBearerToken', async () => {
    await TEST.ts.db.Tokens.query().insert({
      discord_id: 1,
      token: '123',
      created_at: '2000-01-01 01:00:00',
    });
    try {
      assert.notExists(await TEST.ts.checkBearerToken('123'));
    } catch (error) {
      assert.instanceOf(error, TEST.ts.UserError);
      assert.equal(error.msg, 'Token expired. Need to relogin');
    }
  });

  it('ts.message plural', async () => {
    assert.equal(
      TEST.ts.message('clear.earnedPoints', { earned_points: 0 }),
      ' ‣You have earned 0.0 points',
    );

    assert.equal(
      TEST.ts.message('clear.earnedPoints', { earned_points: 0.5 }),
      ' ‣You have earned 0.5 points',
    );

    assert.equal(
      TEST.ts.message('clear.earnedPoints', { earned_points: 1 }),
      ' ‣You have earned 1.0 point',
    );

    assert.equal(
      TEST.ts.message('clear.earnedPoints', { earned_points: 2 }),
      ' ‣You have earned 2.0 points',
    );
  });

  it('ts.message 1dp', async () => {
    assert.equal(
      TEST.ts.message('judge.approved', { difficulty: 1 }),
      'This level was approved for difficulty: 1.0!',
    );

    assert.equal(
      TEST.ts.message('judge.approved', { difficulty: 1.25 }),
      'This level was approved for difficulty: 1.3!',
    );

    assert.equal(
      TEST.ts.message('judge.approved', { difficulty: 1.5 }),
      'This level was approved for difficulty: 1.5!',
    );

    assert.equal(
      TEST.ts.message('judge.approved', { difficulty: '1' }),
      'This level was approved for difficulty: 1.0!',
    );
    assert.equal(
      TEST.ts.message('judge.approved', { difficulty: 'lol' }),
      'This level was approved for difficulty: lol!',
    );
  });
});
