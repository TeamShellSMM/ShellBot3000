const Teams = require('../../src/models/Teams')();

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

  it('new TS no client', async function () {
    assert.throws(
      () => new TEST.TS('guild_id'),
      Error,
      'No client passed to TS()',
    );
  });

  it('new TS no guild found', async function () {
    assert.throws(
      () => new TEST.TS('guild_id', TEST.client),
      Error,
      'Cannot find discord server. Invalid guild_id or ShellBot is not on this server.',
    );
  });

  it('Check team model loading without guild_id', async function () {
    assert.exists(Teams);
    assert.doesNotThrow(async () => {
      await Teams.query().select();
    });
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

  it('TS.teamFromUrl unfound slug', async function () {
    assert.isFalse(TEST.TS.teamFromUrl('unknown_string'));
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
    await TEST.ts.updatePinned().catch((e) => {
      assert.instanceOf(e, TypeError);
      assert.equal(e.message, 'channel_name undefined');
    });
    await TEST.ts.updatePinned('channel-name').catch((e) => {
      assert.instanceOf(e, TypeError);
      assert.equal(e.message, 'embed not defined');
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

  it('ts.getEmoteUrl no arguments', async () => {
    assert.equal(await TEST.ts.getEmoteUrl(), '');
  });

  it('ts.valid_code no arguments', async () => {
    assert.isFalse(await TEST.ts.valid_code());
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

  it('ts.findChannels', async () => {
    assert.exists(TEST.ts.findChannel({ name: 'general' }));
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

  it('ts.secureData and verifyData', async () => {
    const rawData = [
      { id: 1, value: 1 },
      { id: 2, value: 1 },
      { id: 3, value: 1 },
      { value: 4 },
    ];
    const secureData = TEST.ts.secure_data(rawData);
    const verifiedData = TEST.ts.verify_data(secureData);
    assert.lengthOf(verifiedData, 4);
    try {
      TEST.ts.verify_data(rawData);
    } catch (error) {
      assert.instanceOf(error, TEST.ts.UserError);
      assert.equal(
        error.msg,
        'There was something wrong with the secure tokens. Please try again',
      );
    }

    try {
      secureData[0].id = 4;
      TEST.ts.verify_data(secureData);
    } catch (error) {
      assert.instanceOf(error, TEST.ts.UserError);
      assert.equal(
        error.msg,
        'There was something wrong with the secure tokens. Please try again',
      );
    }

    try {
      secureData[0].__SECURE = 'wrong token';
      TEST.ts.verify_data(secureData);
    } catch (error) {
      assert.instanceOf(error, TEST.ts.UserError);
      assert.equal(
        error.msg,
        'There was something wrong with the secure tokens. Please try again',
      );
    }
  });
});
