describe('!points', function () {
  before(async () => {
    await TEST.setupData({
      Members: [{
        name: 'Mod',
        discord_id: '128',
        is_mod:1,
      }, {
        name: 'Creator',
        discord_id: '256',
      }, {
        name: 'Banned',
        discord_id: '-1',
        is_banned:1,
      }],
      Levels: [{
        level_name: 'approved level',
        creator: 2,
        code: 'XXX-XXX-XXX',
        status: 1,
        difficulty: 1,
      },{
        level_name: 'pending level',
        creator: 2,
        code: 'XXX-XXX-XX2',
        status: 0,
        difficulty: 0,
      }],
    });
  });

  it('!points', async function () {
    TEST.ts.teamVariables['Minimum Point']=0
    assert.equal(await TEST.mockBotSend({
      cmd: '!points',
      channel: 'general',
      discord_id: '128',
    }),'<@128> You have 0.0 clear points. You have submitted 0 level(s) .You have enough points to upload a level  You have earned the rank **no rank** ')
  })

  it('!points after one clear', async function () {
    TEST.ts.teamVariables['Minimum Point']=0
    assert.equal(await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX',
      channel: 'general',
      discord_id: '128',
    }),'<@128> \n ‣You have cleared \'approved level\'  by Creator \n ‣You have earned 1 points')

    assert.equal(await TEST.mockBotSend({
      cmd: '!points',
      channel: 'general',
      discord_id: '128',
    }),'<@128> You have 1.0 clear points. You have submitted 0 level(s) .You have enough points to upload a level  You have earned the rank **no rank** ')
  })


  it('!points with minimum level upload=10, not enough to upload', async function () {
    TEST.ts.teamVariables['Minimum Point']=10
    assert.equal(await TEST.mockBotSend({
      cmd: '!points',
      channel: 'general',
      discord_id: '128',
    }),'<@128> You have 1.0 clear points. You have submitted 0 level(s) .You need  points to upload a new level . Check how the points are mapped on http://localhost:8080//makerteam You have earned the rank **no rank** ')
  })

  /* currently doesn't work with how we mock the discord
  it('!points role, get discord role', async function () {
    await TEST.clearUserBot()
    await TEST.ts.db.Members.query().patch({clear_score_sum:5}).where({discord_id:'128'})
    console.log(TEST.getUserBot())
    console.log(TEST.ts.getGuild())
    assert.equal(await TEST.mockBotSend({
      cmd: '!points role',
      channel: 'general',
      discord_id: '128',
    }),'<@128> You have 1.0 clear points. You have submitted 0 level(s) .You need  points to upload a new level . Check how the points are mapped on http://localhost:8080//makerteam You have earned the rank **no rank** ')

    console.log(TEST.getUserBot())
  })
  //*/
})