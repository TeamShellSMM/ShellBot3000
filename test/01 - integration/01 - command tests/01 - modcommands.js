describe('modcommands', function () {
  before(async () => {
    await TEST.clearChannels();
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
          name: 'Banned',
          discord_id: '-1',
          is_banned: 1,
        },
        {
          name: 'Player',
          discord_id: '512',
        },
        {
          name: 'MemberKeep',
          discord_id: '1',
          is_member: 1,
          atme: 1,
        },
        {
          name: 'MemberMerge',
          discord_id: '2',
          is_mod: 1,
          maker_id: '123-123-123',
          maker_name: 'MemberMergeSMM',
          world_description: 'Super Member World',
          world_world_count: 5,
          world_level_count: 20,
          atme: 0,
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
          level_name: 'keep level',
          creator: 5,
          code: 'XXX-XXX-XX8',
          status: 1,
          difficulty: 2.5,
        },
        {
          level_name: 'merge level',
          creator: 6,
          code: 'XXX-XXX-XX9',
          status: 1,
          difficulty: 3,
        },
      ],
    });

    await TEST.setupKnex({
      plays: [
        {
          code: 1,
          player: 5,
          completed: 1,
          guild_id: 1,
        },
        {
          code: 2,
          player: 5,
          completed: 1,
          liked: 1,
          guild_id: 1,
        },
        {
          code: 6,
          player: 5,
          completed: 1,
          liked: 1,
          guild_id: 1,
        },
        {
          code: 2,
          player: 6,
          completed: 1,
          guild_id: 1,
        },
        {
          code: 1,
          player: 6,
          completed: 1,
          liked: 1,
          guild_id: 1,
        },
      ],
      videos: [
        {
          level_id: 1,
          submitter_id: 6,
          type: 'twitch-clips',
          url: 'twitch.tv/merge1',
          guild_id: 1,
        },
        {
          level_id: 1,
          play_id: 1,
          type: 'twitch-clips',
          url: 'twitch.tv/merge1',
          guild_id: 1,
        },
        {
          level_id: 1,
          play_id: 4,
          type: 'twitch-clips',
          url: 'twitch.tv/merge1',
          guild_id: 1,
        },
      ],
    });
  });

  it('!modaddclear success', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modaddclear Player XXX-XXX-XX4',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      "Play updated for: Player\n ‣You have cleared 'level4'  by Creator \n ‣You have earned 2.5 points",
    );
  });

  it('!modaddclear invalid member', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modaddclear Player2 XXX-XXX-XX4',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      '>>> **!modaddclear __<memberName>__ <levelCode> <difficultyVote | difficultyVote like/unlike | like/unlike>**\n<@128>, No member with the name "Player2" was found in the members list. ',
    );
  });

  it('!modremoveclear invalid member', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modremoveclear Player2 XXX-XXX-XX4',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      '>>> **!modremoveclear __<memberName>__ <levelCode>**\n<@128>, No member with the name "Player2" was found in the members list. ',
    );
  });

  it('!modremoveclear success', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modremoveclear Player XXX-XXX-XX4',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      "You have successfully removed 'Player's clear of 'level4' (made by Creator).",
    );
  });

  it('!modremoveclear no clear', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modremoveclear Player XXX-XXX-XX4',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      "'Player' doesn't have a clear of 'level4' (made by Creator).",
    );
  });

  it('!modaddlevel success', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modaddlevel Creator XXX-XXX-XX5 SMW test5',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      'The level test5 (XXX-XXX-XX5) has been added ',
    );
  });

  it('!modaddlevel invalid member', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modaddlevel Creator2 XXX-XXX-XX5 SMW test5',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      '>>> **!modaddlevel __<memberName>__ <levelCode> <gameStyle> <levelName>**\n<@128>, No member with the name "Creator2" was found in the members list. ',
    );
  });

  it('!modremovelevel success', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modremovelevel XXX-XXX-XX5 reason',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result[1].author.name,
      'This level has been removed by Mod',
    );
    assert.equal(
      result[3].author.name,
      "We're very sorry, but this level has just been manually removed.",
    );
    assert.equal(
      result[4],
      "You have successfully deleted 'test5' by <@256>, the creator has already been notified with your reason for the deletion.",
    );
  });

  it('!modremovelevel already removed', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modremovelevel XXX-XXX-XX5 reason',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      '>>> **!modremovelevel __<levelCode>__ <reason>**\n<@128>, "test5" by Creator has already been removed ',
    );
  });

  it('!modaddmember success', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modaddmember NewCreator',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      'The member "NewCreator" has been successfully added.',
    );
  });

  it('!modaddmember invalid name', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modaddmember <@80351110224678912>',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      ">>> **!modaddmember __<memberName>__**\n<@128>, We can't process your command because it had special discord strings like <@666085542085001246> in it ",
    );
  });

  it('!modaddplayvid no clear yet', async function () {
    const result = await TEST.mockBotSend({
      cmd:
        '!modaddplayvids Player XXX-XXX-XX4 https://youtube.com/adsfasf',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      "You haven't submitted a clear for this level yet, try using `!clear XXX-XXX-XX4` before trying to add a video. ",
    );
  });

  it('!modaddplayvid success', async function () {
    await TEST.mockBotSend({
      cmd: '!modaddclear Player XXX-XXX-XX4',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    const result = await TEST.mockBotSend({
      cmd:
        '!modaddplayvids Player XXX-XXX-XX4 https://youtube.com/adsfasf',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      '<@128> Clear videos added for "level4" by "Creator" \nYour current videos:```\nhttps://youtube.com/adsfasf```',
    );
  });

  it('!modaddplayvid invalid name', async function () {
    const result = await TEST.mockBotSend({
      cmd:
        '!modaddplayvids Player2 XXX-XXX-XX4 https://youtube.com/adsfasf',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      '>>> **!modaddplayvids __<memberName>__ <levelCode> <newVids>**\n<@128>, No member with the name "Player2" was found in the members list. ',
    );
  });

  it('!modremoveplayvid success', async function () {
    const result = await TEST.mockBotSend({
      cmd:
        '!modremoveplayvids Player XXX-XXX-XX4 https://youtube.com/adsfasf',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      '<@128> Clear videos removed for "level4" by "Creator" \nCurrent videos:```\n```',
    );
  });

  it('!modrenamemember success', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modrenamemember NewCreator "NewCreator 2"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      "The member 'NewCreator' has successfully been renamed to 'NewCreator 2'.",
    );
  });

  it('!modrenamemember invalid member', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modrenamemember NewCreator "NewCreator 2"',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      '>>> **!modrenamemember __<oldMemberName>__ <newMemberName>**\n<@128>, No member with the name "NewCreator" was found in the members list. ',
    );
  });

  it('!modsetdiscordid success', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modsetdiscordid "NewCreator 2" 123456789',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    assert.equal(
      result,
      'The discord id was sucessfully set on the member with the name "NewCreator 2".',
    );
  });

  it('!modmergemember', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!modmergemember MemberKeep MemberMerge',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });

    await TEST.ts.recalculateAfterUpdate();

    const memberKeep = await TEST.ts.db.Members.query()
      .where({ id: 5 })
      .first();
    const memberMerge = await TEST.ts.db.Members.query()
      .where({ id: 6 })
      .first();

    assert.equal(memberKeep.name, 'MemberKeep');
    assert.equal(memberKeep.is_mod, 1);
    assert.equal(memberKeep.is_member, 1);
    assert.equal(memberKeep.maker_id, '123-123-123');
    assert.equal(memberKeep.maker_name, 'MemberMergeSMM');
    assert.equal(memberKeep.world_description, 'Super Member World');
    assert.equal(memberKeep.atme, 1);
    assert.equal(memberKeep.world_world_count, 5);
    assert.equal(memberKeep.world_level_count, 20);
    assert.equal(memberKeep.levels_created, 2);
    assert.equal(memberKeep.levels_cleared, 2);

    assert.equal(memberMerge.name, 'MemberMerge (merged)');
    assert.equal(memberMerge.discord_id, null);
    assert.equal(memberMerge.is_mod, 0);
    assert.equal(memberMerge.is_member, 0);
    assert.equal(memberMerge.maker_id, null);
    assert.equal(memberMerge.maker_name, null);
    assert.equal(memberMerge.world_description, null);
    assert.equal(memberMerge.atme, null);
    assert.equal(memberMerge.world_world_count, 0);
    assert.equal(memberMerge.levels_created, 0);
    assert.equal(memberMerge.levels_cleared, 0);

    assert.equal(
      result,
      "All of 'MemberMerge's levels, clears, races, competitions, submitted videos and pending votes have been migrated to 'MemberKeep's account. 'MemberMerge's discord id has also been unset (their account will stay in the DB as 'MemberMerge (merged)').",
    );
  });
});
