describe('!clears', function () {
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
        {
          level_name: 'level4',
          creator: 2,
          code: 'XXX-XXX-XX4',
          status: 1,
          difficulty: 2.5,
        },
        {
          level_name: 'level5',
          creator: 2,
          code: 'XXX-XXX-XX5',
          status: 1,
          difficulty: 2.5,
        },
      ],
    });
  });

  it('no level code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      `>>> **!clear __<levelCode>__ <difficultyVote | difficultyVote like/unlike | like/unlike>**\n${await TEST.mockMessageReply(
        'error.noCode',
        { type: 'userError', discord_id: 256 },
        {},
      )}`,
    );
  });

  it('unregistered', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear xxx-xxx-xxx',
      channel: 'general',
      discord_id: '1000', // '-256' should error but dont
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'error.notRegistered',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it('barred user', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX',
      channel: 'general',
      discord_id: '-1', // '-256' should error but dont
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'error.userBanned',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it('invalid difficulty', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX 31.4',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'clear.invalidDifficulty',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it('invalid difficulty level code as difficulty', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XX5 7gk-413-lxg',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'clear.invalidDifficulty',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it("can't clear own level", async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      await TEST.mockMessage(
        'clear.ownLevel',
        { type: 'userError' },
        { name: 'Creator' },
      ),
    );
  });

  it('basic clear', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(
      result,
      "<@128> \n ‣You have cleared 'level1'  by Creator \n ‣You have earned 1.0 point",
    );
  });

  it('clear with like', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX like',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(
      result,
      "<@128> \n ‣You have already submitted a clear for 'level1'  by Creator\n ‣You have liked this level ",
    );
  });

  it('clear with LIKE', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX LIKE',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(
      result,
      "<@128> \n ‣You have already submitted a clear for 'level1'  by Creator\n ‣You have already liked this level ",
    );
  });

  it('clear with invalid parameters', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX llike',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(
      result,
      'You did not provide a valid difficulty vote ',
    );
  });

  it('clear with difficulty', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX 5',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(
      result,
      "<@128> \n ‣You have already submitted a clear for 'level1'  by Creator\n ‣You have voted 5.0 as the difficulty for this level ",
    );
  });

  it('remove difficulty', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!clear XXX-XXX-XXX 5 1',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have already submitted a clear for 'level1'  by Creator\n ‣You have already voted 5 for this level \n ‣You also have already liked this level ",
    );

    let play = await TEST.ts.db.Plays.query()
      .where({ code: 1, player: 1 })
      .first();
    assert.exists(play);
    assert.equal(play.difficulty_vote, 5);
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!clear XXX-XXX-XXX 0 1',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have already submitted a clear for 'level1'  by Creator\n‣You have removed your difficulty vote for this level \n ‣You also have already liked this level ",
    );
    play = await TEST.ts.db.Plays.query()
      .where({ code: 1, player: 1 })
      .first();
    assert.exists(play);
    assert.isNull(play.difficulty_vote);
  });

  it('!clear pending', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!clear XXX-XXX-XX2',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have cleared 'level2'  by Creator \n ‣This level is still pending",
    );
  });

  it('!clear like/unlike argument', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!clear XXX-XXX-XXX 5 like',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have already submitted a clear for 'level1'  by Creator\n ‣You have voted 5.0 as the difficulty for this level \n ‣You also have already liked this level ",
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!clear XXX-XXX-XXX 5 unlike',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have already submitted a clear for 'level1'  by Creator\n ‣You have already voted 5 for this level \n‣You also have unliked this level ",
    );
  });

  it('!clear like/unlike argument', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!clear XXX-XXX-XXX like',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have already submitted a clear for 'level1'  by Creator\n ‣You have liked this level ",
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!clear XXX-XXX-XXX unlike',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have already submitted a clear for 'level1'  by Creator\n‣You have unliked this level ",
    );
  });

  it('!clear with creator having atme', async () => {
    await TEST.ts.db.Members.query()
      .patch({ atme: 1 })
      .where({ discord_id: '256' });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!clear XXX-XXX-XXX 5 like',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have already submitted a clear for 'level1'  by <@256>\n ‣You have already voted 5 for this level \n ‣You also have liked this level ",
    );
  });

  it('clear with like and difficulty 2.5 points earned', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XX4 5 like',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(
      result,
      "<@128> \n ‣You have cleared 'level4'  by <@256> \n ‣You have earned 2.5 points\n ‣You also have voted 5.0 as the difficulty for this level \n ‣You also have liked this level ",
    );
  });

  it('!difficulty (a !clear with 0 completed and like)', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!difficulty XXX-XXX-XX4 5',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have already voted 5 for 'level4'  by <@256> ",
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!difficulty XXX-XXX-XX4 5',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have already voted 5 for 'level4'  by <@256> ",
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!difficulty XXX-XXX-XX4 0',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n‣You have removed your difficulty vote for 'level4'  by <@256> ",
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!difficulty XXX-XXX-XX4 0',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You haven't submitted a difficulty vote for 'level4'  by <@256> ",
    );
  });

  it('!like and unlike', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!like XXX-XXX-XX4',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have already liked 'level4'  by <@256> ",
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!like XXX-XXX-XX4',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have already liked 'level4'  by <@256> ",
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!unlike XXX-XXX-XX4',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n‣You have unliked 'level4'  by <@256> ",
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!unlike XXX-XXX-XX4',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have not added a like for 'level4'  by <@256> ",
    );
  });

  it('!clear and remove clear', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!clear XXX-XXX-XX4',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have already submitted a clear for 'level4'  by <@256>",
      'clear',
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!clear XXX-XXX-XX4',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have already submitted a clear for 'level4'  by <@256>",
      'already cleared',
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!removeclear XXX-XXX-XX4',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \nYou have removed your clear for 'level4'  by <@256>",
      'remove clear',
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!removeclear XXX-XXX-XX4',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have not submited a clear for 'level4'  by <@256>",
      'already removed clear',
    );
  });
});
