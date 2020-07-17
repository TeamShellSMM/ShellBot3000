describe('!removevote', function () {
  const initData = {
    Members: [
      {
        name: 'Creator',
        discord_id: '64',
      },
      {
        name: 'Mod1',
        discord_id: '128',
      },
      {
        name: 'Mod2',
        discord_id: '256',
      },
      {
        name: 'Mod3',
        discord_id: '512',
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
    PendingVotes: [
      {
        code: 1,
        player: 2,
        type: 'approve',
        reason: 'yes',
        difficulty_vote: 2.5,
      },
      {
        code: 1,
        player: 3,
        type: 'approve',
        reason: 'yes',
        difficulty_vote: 2.5,
      },
      {
        code: 2,
        player: 2,
        type: 'approve',
        reason: 'yes',
        difficulty_vote: 2.5,
      },
    ],
  };
  beforeEach(async () => {
    await TEST.clearChannels();
    await TEST.setupData(initData);
    await TEST.ts.load();
  });

  it('not in pendingCategory', async () => {
    await TEST.createChannel({
      name: 'XXX-XXX-XXX',
    });
    const result = await TEST.mockBotSend({
      cmd: '!removevote',
      channel: 'xxx-xxx-xxx',
      waitFor: 100,
      discord_id: '128',
    });
    assert.lengthOf(result, 0, 'no result');
  });

  it('in non modChannel', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!removevote',
      channel: 'general',
      waitFor: 100,
      discord_id: '128',
    });
    assert.lengthOf(result, 0, 'no result');
  });

  it('not pending', async () => {
    await TEST.createChannel({
      name: 'XXX-XXX-XX2',
      parent: TEST.ts.channels.levelDiscussionCategory,
    });

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!removevote',
        channel: 'XXX-XXX-XX2',
        waitFor: 100,
        discord_id: '256',
      }),
      'Level is not pending! ',
    );
  });

  it('no vote submitted', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!removevote xxx-xxx-xxx',
      channel: TEST.ts.channels.modChannel,
      waitFor: 100,
      discord_id: '512',
    });
    assert.equal(
      result,
      'You have not submitted any votes for "level1" by Creator ',
    );
  });

  it('success', async () => {
    // TODO: if we dont stub this it gives an error when we don't run the whole suite
    // Error: Request to use token, but token was unavailable to the client.
    const discussionChannel = sinon.stub(
      TEST.ts,
      'pendingDiscussionChannel',
    );
    discussionChannel.returns({
      channel: 'stub',
    });
    const result = await TEST.mockBotSend({
      cmd: '!removevote xxx-xxx-xxx',
      channel: TEST.ts.channels.modChannel,
      waitFor: 100,
      discord_id: '128',
    });
    assert.equal(
      result[0].fields[0].value,
      '__Current Votes for approving the level:__\n<@256> - Difficulty: 2.5, Reason: yes\n\n__Current Votes for fixing the level:__\n> None\n\n__Current votes for rejecting the level:__\nNone\n.',
    );
    assert.equal(
      result[1],
      'You have removed your vote for "level1" by Creator',
    );

    sinon.assert.calledOnce(discussionChannel);
    sinon.restore();
  });
});
