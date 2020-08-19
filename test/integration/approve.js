describe('!approve', function () {
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
        name: 'Mod2',
        discord_id: '256',
        is_mod: 1,
      },
      {
        name: 'Mod3',
        discord_id: '512',
        is_mod: 1,
      },
    ],
    Levels: [
      {
        level_name: 'level1',
        creator: 1,
        code: 'XXX-XXX-XXX',
        status: 0,
        difficulty: 0,
        tags: 'tag1,tag2,tag3',
        videos: 'http://twitch.tv,http://youtube.com',
      },
      {
        level_name: 'approved level',
        creator: 1,
        code: 'XXX-XXX-XX2',
        status: 1,
        tags: 'tag1,tag2,tag3',
        difficulty: 1,
      },
      {
        level_name: 'removed level',
        creator: 1,
        code: 'XXX-XXX-XX3',
        status: -1,
        tags: 'tag1,tag2,tag3',
        difficulty: 1,
      },
    ],
  };
  beforeEach(async () => {
    await TEST.clearChannels();
    await TEST.setupData(initData);
    await TEST.ts.load();

    await TEST.knex('members')
      .update({ is_mod: 1 })
      .where({ discord_id: '128' });
    await TEST.knex('members')
      .update({ is_mod: 1 })
      .where({ discord_id: '256' });
    await TEST.knex('members')
      .update({ is_mod: 1 })
      .where({ discord_id: '512' });
  });

  it('judge not in pendingCategory', async () => {
    await TEST.createChannel({
      name: 'XXX-XXX-XXX',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    const result = await TEST.mockBotSend({
      cmd: '!judge',
      channel: 'xxx-xxx-xxx',
      waitFor: 100,
      discord_id: '256',
    });
    assert.lengthOf(result, 0, 'no result');
  });

  it('in non modChannel', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX 5 "is good level"',
      channel: 'general',
      waitFor: 100,
      discord_id: '256',
    });
    assert.lengthOf(result, 0, 'no result');
  });

  it('approve judge not pending', async () => {
    await TEST.createChannel({
      name: 'XXX-XXX-XX2',
      parent: TEST.ts.channels.levelDiscussionCategory,
    });

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!judge',
        channel: 'XXX-XXX-XX2',
        waitFor: 100,
        discord_id: '256',
      }),
      'Level is not pending! ',
    );
  });

  it('approve reason=1500', async function () {
    const result = await TEST.mockBotSend({
      cmd:
        '!approve XXX-XXX-XXX 5 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin pellentesque sapien enim, vitae vestibulum metus pulvinar eget. Aliquam tincidunt lacinia scelerisque. Lorem ipsum dolor sit amet, consectetur adipiscing elit. In gravida turpis id neque facilisis laoreet. Curabitur luctus gravida purus eget scelerisque. Ut et lectus sapien. Nam egestas enim ut rutrum efficitur. Aliquam sit amet sollicitudin velit. Donec quis est volutpat, iaculis ipsum pharetra, egestas eros. Donec leo quam, posuere at dolor ut, consequat eleifend urna. Morbi non scelerisque eros. Suspendisse vitae semper tellus. Nullam malesuada dolor ex. Ut posuere erat sed placerat pellentesque. Phasellus lacinia pellentesque vulputate. Sed ultrices molestie massa id imperdiet. Ut et erat dictum, auctor neque et, lacinia turpis. Donec fermentum nunc sed leo ornare ullamcorper. Maecenas dapibus, massa vel ultricies iaculis, mauris dui efficitur ante, et pretium lectus turpis venenatis felis. In vitae posuere mauris, in finibus turpis. Cras sodales odio sed lacus eleifend, non laoreet nisi varius. Proin gravida iaculis mi, a lobortis risus iaculis eget. Praesent gravida volutpat sapien, ornare convallis eros hendrerit nec. Pellentesque molestie a nisl non fermentum. Etiam quis luctus erat. Nullam lacinia lacus id erat pretium dictum ut sed neque. Sed gravida ultricies sapien, quis rutrum tortor eleifend eu. Sed rhoncus sodales lectus, ac convallis sapien finibus ut. Sed tincidunt convalis ornare. Curabitur amet.',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    assert.match(result[1], /Your vote was added to <#[0-9]+>!/);
  });

  it('approve reason=1501', async function () {
    const result = await TEST.mockBotSend({
      cmd:
        '!approve XXX-XXX-XXX 5 Lorem ipsum doloor sit amet, consectetur adipiscing elit. Proin pellentesque sapien enim, vitae vestibulum metus pulvinar eget. Aliquam tincidunt lacinia scelerisque. Lorem ipsum dolor sit amet, consectetur adipiscing elit. In gravida turpis id neque facilisis laoreet. Curabitur luctus gravida purus eget scelerisque. Ut et lectus sapien. Nam egestas enim ut rutrum efficitur. Aliquam sit amet sollicitudin velit. Donec quis est volutpat, iaculis ipsum pharetra, egestas eros. Donec leo quam, posuere at dolor ut, consequat eleifend urna. Morbi non scelerisque eros. Suspendisse vitae semper tellus. Nullam malesuada dolor ex. Ut posuere erat sed placerat pellentesque. Phasellus lacinia pellentesque vulputate. Sed ultrices molestie massa id imperdiet. Ut et erat dictum, auctor neque et, lacinia turpis. Donec fermentum nunc sed leo ornare ullamcorper. Maecenas dapibus, massa vel ultricies iaculis, mauris dui efficitur ante, et pretium lectus turpis venenatis felis. In vitae posuere mauris, in finibus turpis. Cras sodales odio sed lacus eleifend, non laoreet nisi varius. Proin gravida iaculis mi, a lobortis risus iaculis eget. Praesent gravida volutpat sapien, ornare convallis eros hendrerit nec. Pellentesque molestie a nisl non fermentum. Etiam quis luctus erat. Nullam lacinia lacus id erat pretium dictum ut sed neque. Sed gravida ultricies sapien, quis rutrum tortor eleifend eu. Sed rhoncus sodales lectus, ac convallis sapien finibus ut. Sed tincidunt convalis ornare. Curabitur amet.',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    assert.equal(
      result,
      "Your reason/comment can't be longer than 1500 ",
    );
  });

  it('approve', async function () {
    sinon.restore();
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX 5 "is good level"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX 2 "ya"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '512',
    });
    const channel = await TEST.ts.discord.channel('xxx-xxx-xxx');
    assert.isOk(channel);
    assert.match(result[1], /Your vote was added to <#[0-9]+>!/);

    const dwMember = sinon.stub(TEST.ts.discord, 'member');
    const addRole = sinon.stub(TEST.ts.discord, 'addRole');
    dwMember.returns(true);

    const result3 = await TEST.mockBotSend({
      cmd: '!judge',
      channel: 'XXX-XXX-XXX',
      discord_id: '256',
    });

    sinon.assert.calledOnce(addRole);
    assert.notEqual(
      result3,
      await TEST.mockMessage('approval.comboBreaker', {
        type: 'userError',
      }),
    );

    assert.equal(result3[0], 'We welcome <@64> to our team!');
    assert.equal(result3[1], '**<@64>, we got some news for you: **');
    assert.deepInclude(result3[2], {
      title: 'level1 (XXX-XXX-XXX)',
      description:
        'made by [Creator](http://localhost:8080/makerteam/maker/Creator)\n' +
        'Difficulty: 0, Clears: 0, Likes: 0\n' +
        'Tags: [tag1](http://localhost:8080/makerteam/levels/tags/tag1),[tag2](http://localhost:8080/makerteam/levels/tags/tag2),[tag3](http://localhost:8080/makerteam/levels/tags/tag3)\n' +
        'Clear Video: [ 🎬 ](http://twitch.tv),[ 🎬 ](http://youtube.com)',
      url: 'http://localhost:8080/makerteam/level/XXX-XXX-XXX',
      color: 106911,
      author: {
        name: 'This level was approved for difficulty: 3.5!',
        icon_url: undefined,
        url: undefined,
      },
    });

    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    assert.isOk(level);
    assert.equal(level.code, 'XXX-XXX-XXX');
    assert.equal(level.status, TEST.ts.LEVEL_STATUS.APPROVED);
    assert.equal(level.difficulty, 3.5);

    sinon.restore();
  });

  it('approve+cl', async function () {
    await TEST.mockBotSend({
      cmd: '!approve+cl XXX-XXX-XXX 5 "is good level"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    const plays = await TEST.ts
      .getPlays()
      .where({ player: 2 })
      .first();
    assert.deepInclude(plays, {
      liked: 1,
      completed: 1,
      code: 'XXX-XXX-XXX',
    });
  });

  it('approve+c', async function () {
    await TEST.mockBotSend({
      cmd: '!approve+c XXX-XXX-XXX 5 "is good level"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    const plays = await TEST.ts
      .getPlays()
      .where({ player: 2 })
      .first();
    assert.deepInclude(plays, {
      liked: 0,
      completed: 1,
      code: 'XXX-XXX-XXX',
    });
  });

  it('approve already approved level', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XX2 5 "is good level"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    assert.equal(result, 'Level is already approved! ');
  });

  it('approve no code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!approve',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    assert.equal(result, 'You did not give a level code ');
  });

  it('approve no reason', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX 5',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    assert.equal(
      result,
      'You need to give a reason for the change (in quotation marks)! ',
    );
  });

  it('approve invalid difficulty', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX invalid long reason',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    assert.equal(result, 'Invalid difficulty format! ');
  });

  it('approve with emoji reason', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX 5 "I like it 💀"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    assert.notEqual(result, 'something went wrong buzzyS');
    assert.match(result, /Your vote was added to <#[0-9]+>!/);
  });

  it('approve not pending level', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XX3 5 "is good level"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    assert.equal(result, 'Level is not pending! ');
  });

  it('reject', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!reject XXX-XXX-XXX "is not good level"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    const channel = await TEST.ts.discord.channel('xxx-xxx-xxx');
    assert.isOk(channel);
    assert.deepInclude(result[0], {
      title: 'level1 (XXX-XXX-XXX)',
      description:
        'made by [Creator](http://localhost:8080/makerteam/maker/Creator)\n' +
        'Difficulty: 0, Clears: 0, Likes: 0\n' +
        'Tags: [tag1](http://localhost:8080/makerteam/levels/tags/tag1),[tag2](http://localhost:8080/makerteam/levels/tags/tag2),[tag3](http://localhost:8080/makerteam/levels/tags/tag3)\n' +
        'Clear Video: [ 🎬 ](http://twitch.tv),[ 🎬 ](http://youtube.com)',
    });
    assert.match(result[1], /Your vote was added to <#[0-9]+>!/);

    const result2 = await TEST.mockBotSend({
      cmd: '!reject "no"',
      channel: 'xxx-xxx-xxx',
      discord_id: '512',
    });
    assert.equal(
      result2[1],
      await TEST.mockMessage(
        'approval.voteAdded',
        {
          type: 'normal',
          discord_id: '512',
        },
        {
          channel_id: channel.id,
        },
      ),
    );

    // TODO: check embed info here: result3[1]
    const result3 = await TEST.mockBotSend({
      cmd: '!judge',
      channel: 'XXX-XXX-XXX',
      discord_id: '256',
    });
    assert.notEqual(
      result3,
      await TEST.mockMessage('approval.comboBreaker', {
        type: 'userError',
      }),
    );

    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    assert.isOk(level);
    assert.equal(level.code, 'XXX-XXX-XXX');
    assert.equal(level.status, TEST.ts.LEVEL_STATUS.REJECTED);
    assert.equal(level.difficulty, 0);
  });

  it('apr.fix', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!fix XXX-XXX-XXX 4 Fix your jank',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    await TEST.mockBotSend({
      cmd: '!fix XXX-XXX-XXX 2 no',
      channel: TEST.ts.channels.modChannel,
      discord_id: '512',
    });
    const channel = await TEST.ts.discord.channel('xxx-xxx-xxx');
    assert.isOk(channel);
    assert.deepInclude(result[0], {
      title: 'level1 (XXX-XXX-XXX)',
      description:
        'made by [Creator](http://localhost:8080/makerteam/maker/Creator)\n' +
        'Difficulty: 0, Clears: 0, Likes: 0\n' +
        'Tags: [tag1](http://localhost:8080/makerteam/levels/tags/tag1),[tag2](http://localhost:8080/makerteam/levels/tags/tag2),[tag3](http://localhost:8080/makerteam/levels/tags/tag3)\n' +
        'Clear Video: [ 🎬 ](http://twitch.tv),[ 🎬 ](http://youtube.com)',
      author: {
        name: 'The Judgement  has now begun for this level:',
        icon_url: undefined,
        url: undefined,
      },
    });
    assert.match(result[1], /Your vote was added to <#[0-9]+>!/);
    const result3 = await TEST.mockBotSend({
      cmd: '!judge',
      channel: 'XXX-XXX-XXX',
      discord_id: '256',
    });

    assert.deepInclude(result3[1], {
      title: 'level1 (XXX-XXX-XXX)',
      description:
        "If you want to fix these issues use **!reupload** (to get it approved really quickly) or if you don't want to just use **!refusefix** and the mods will decide if it's still acceptable.",
      url: 'http://localhost:8080/makerteam/level/XXX-XXX-XXX',
      color: 14057728,
      author: {
        name:
          "This level is one step from being approved, we'd just like to see some fixes!",
        icon_url: undefined,
        url: undefined,
      },
      fields: [
        {
          name: 'Mod2 voted for fix with difficulty 4.0:',
          value: 'Fix your jank.',
          inline: false,
        },
        {
          name: 'Mod3 voted for fix with difficulty 2.0:',
          value: 'no.',
          inline: false,
        },
      ],
    });

    assert.notEqual(
      result3,
      await TEST.mockMessage('approval.comboBreaker', {
        type: 'userError',
      }),
    );
    assert.notEqual(
      result3,
      await TEST.mockMessage('approval.numVotesNeeded', {
        type: 'normal',
      }),
    );
    const level = await TEST.ts.db.Levels.query()
      .where({ code: 'XXX-XXX-XXX' })
      .first();
    assert.isOk(level);
    assert.equal(level.code, 'XXX-XXX-XXX');
    assert.equal(level.status, TEST.ts.LEVEL_STATUS.NEED_FIX);
    assert.equal(level.difficulty, 0);
  });

  it('approve', async function () {
    await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX 5 "is good level"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    const result = await TEST.mockBotSend({
      cmd: '!approve XXX-XXX-XXX 2 "i changed my mind"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });
    const channel = await TEST.ts.discord.channel('xxx-xxx-xxx');
    assert.equal(
      result[1],
      `Your vote was changed in <#${channel.id}>!`,
    );
  });
});
