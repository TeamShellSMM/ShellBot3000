describe('!points', function () {
  before(async () => {
    TEST.ts.teamVariables.includeOwnPoints = 'false';
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
          level_name: 'approved level',
          creator: 2,
          code: 'XXX-XXX-XX3',
          status: 1,
          difficulty: 1,
        },
      ],
    });
  });

  it('!points', async function () {
    TEST.ts.teamVariables['Minimum Point'] = 0;
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!points',
        channel: 'general',
        discord_id: '128',
      }),
      '<@128> You have 0.0 clear points. You have submitted 0 levels .You have enough points to upload a level  You have earned the rank **no rank** ',
    );
  });

  it('!points creator not include own points', async function () {
    TEST.ts.teamVariables['Minimum Point'] = 0;
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!points',
        channel: 'general',
        discord_id: '256',
      }),
      '<@256> You have 0.0 clear points. You have submitted 3 levels .You have enough points to upload a level  You have earned the rank **no rank** ',
    );
  });

  it('!points creator include own points', async function () {
    TEST.ts.teamVariables.includeOwnPoints = 'true';
    TEST.ts.teamVariables['Minimum Point'] = 0;
    await TEST.ts.recalculateAfterUpdate();
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!points',
        channel: 'general',
        discord_id: '256',
      }),
      '<@256> You have 2.0 clear points. You have submitted 3 levels .You have enough points to upload a level  You have earned the rank **no rank** ',
    );
    TEST.ts.teamVariables.includeOwnPoints = 0;
  });

  it('!points creator include own points, 1 free submission', async function () {
    TEST.ts.teamVariables.includeOwnPoints = 'true';
    TEST.ts.teamVariables['Minimum Point'] = 0;
    await TEST.ts.db.Levels.query().insert({
      level_name: 'free level',
      creator: 2,
      code: 'XXX-XXX-XX3',
      status: 1,
      is_free_submission: 1,
      difficulty: 1,
    });
    await TEST.ts.recalculateAfterUpdate();
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!points',
        channel: 'general',
        discord_id: '256',
      }),
      '<@256> You have 3.0 clear points. You have submitted 4 levels  (1 free submission).You have enough points to upload a level  You have earned the rank **no rank** ',
    );
    TEST.ts.teamVariables.includeOwnPoints = 0;
  });

  it('!points creator include own points, 1 free submission', async function () {
    TEST.ts.teamVariables.includeOwnPoints = 'true';
    TEST.ts.teamVariables['Minimum Point'] = 0;
    await TEST.ts.db.Levels.query().insert({
      level_name: 'free level',
      creator: 2,
      code: 'XXX-XXX-XX3',
      status: 1,
      is_free_submission: 1,
      difficulty: 1,
    });
    await TEST.ts.db.Levels.query().insert({
      level_name: 'free level2',
      creator: 2,
      code: 'XXX-XXX-XX4',
      status: 1,
      is_free_submission: 1,
      difficulty: 1,
    });
    await TEST.ts.recalculateAfterUpdate();
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!points',
        channel: 'general',
        discord_id: '256',
      }),
      '<@256> You have 5.0 clear points. You have submitted 6 levels  (3 free submissions).You have enough points to upload a level  You have earned the rank **rank1** ',
    );
    TEST.ts.teamVariables.includeOwnPoints = 0;
  });

  it('!points after one clear', async function () {
    TEST.ts.teamVariables['Minimum Point'] = 0;
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!clear XXX-XXX-XXX',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have cleared 'approved level'  by Creator \n ‣You have earned 1.0 point",
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!points',
        channel: 'general',
        discord_id: '128',
      }),
      '<@128> You have 1.0 clear point. You have submitted 0 levels .You have enough points to upload a level  You have earned the rank **no rank** ',
    );
  });

  it('!points with minimum level upload=10, not enough to upload', async function () {
    TEST.ts.teamVariables['Minimum Point'] = 10;
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!clear XXX-XXX-XX3',
        channel: 'general',
        discord_id: '128',
      }),
      "<@128> \n ‣You have cleared 'approved level'  by Creator \n ‣You have earned 1.0 point",
    );

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!points',
        channel: 'general',
        discord_id: '128',
      }),
      '<@128> You have 2.0 clear points. You have submitted 0 levels .You need 8.0 more points to upload a new level . Check how the points are mapped on http://localhost:8080/makerteam You have earned the rank **no rank** ',
    );
  });

  // TODO: make these tests independent of one another
  it('!points, mock roles', async function () {
    const addRole = sinon.stub(TEST.ts.discord, 'addRole');
    const removeRoles = sinon.stub(TEST.ts.discord, 'removeRoles');
    await TEST.ts.db.Members.query()
      .patch({ clear_score_sum: 5 })
      .where({ discord_id: '128' });

    assert.equal(
      await TEST.mockBotSend({
        cmd: '!points',
        channel: 'general',
        discord_id: '128',
      }),
      '<@128> You have 5.0 clear points. You have submitted 0 levels .You need 5.0 more points to upload a new level . Check how the points are mapped on http://localhost:8080/makerteam You have earned the rank **rank1** ',
    );

    sinon.assert.calledOnce(addRole);
    sinon.assert.calledOnce(removeRoles);
    sinon.assert.callOrder(removeRoles, addRole);
    sinon.assert.calledWith(removeRoles, '128', TEST.ts.rank_ids);
    sinon.assert.calledWith(addRole, '128'); // add rank
    sinon.restore();
  });
});
