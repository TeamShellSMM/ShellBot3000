describe('cleardifficulty', () => {
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
          likes: 0,
        },
        {
          level_name: 'pending level',
          creator: 2,
          code: 'XXX-XXX-XX2',
          status: 0,
          difficulty: 0,
          tags: 'removetag1,tag2,removetag3,all_locked,remove_locked',
        },
        {
          level_name: 'pending level2',
          creator: 2,
          code: 'XXX-XXX-XX3',
          status: 0,
          difficulty: 0,
          tags: 'tag2',
        },
        {
          level_name: 'approved level 2',
          creator: 2,
          code: 'XXX-XXX-XX4',
          status: 1,
          difficulty: 1,
          likes: 100,
        },
      ],
      Plays: [
        {
          code: 1,
          player: 1,
          completed: 1,
          difficulty_vote: 2,
        },
        {
          code: 1,
          player: 3,
          completed: 1,
          difficulty_vote: 1.5,
        },
        {
          code: 2,
          player: 1,
          completed: 1,
          difficulty_vote: 1.5,
        },
      ],
    });
  });

  it('success', async () => {
    await TEST.ts.db.Members.query()
      .patch({ is_mod: 1 })
      .where({ discord_id: 128 });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!cleardifficulty xxx-xxx-xxx',
        channel: 'general',
        discord_id: '128',
      }),
      'You have cleared the difficulty votes for "approved level" by Creator',
    );
    const plays = await TEST.ts.getPlays();
    assert.deepInclude(plays[0], {
      code: 'XXX-XXX-XXX',
      player: 'Mod',
      completed: 1,
      difficulty_vote: null,
    });
    assert.deepInclude(plays[1], {
      code: 'XXX-XXX-XXX',
      player: 'Other',
      completed: 1,
      difficulty_vote: null,
    });
    assert.deepInclude(plays[2], {
      code: 'XXX-XXX-XX2',
      player: 'Mod',
      completed: 1,
      difficulty_vote: 1.5,
    });
  });
});
