describe('!clears', function () {
  beforeEach(async () => {
    await TEST.setupData({
      Members: [{
        name: 'Mod',
        discord_id: '128',
      }, {
        name: 'Creator',
        discord_id: '256',
      }, {
        name: 'Banned',
        discord_id: '-1',
        is_banned:1,
      }],
      Levels: [{
        level_name: 'level1',
        creator: 2,
        code: 'XXX-XXX-XXX',
        status: 1,
        difficulty: 1,
      },{
        level_name: 'level2',
        creator: 2,
        code: 'XXX-XXX-XX2',
        status: 0,
        difficulty: 0,
      },{
        level_name: 'level3',
        creator: 2,
        code: 'XXX-XXX-XX3',
        status: 1,
        difficulty: 1,
      }],
    });
  });

  it('no level code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await TEST.mockMessage('error.noCode',{type:'userError'},{name:'Creator'}))
  })

  it('unregistered', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear xxx-xxx-xxx',
      channel: 'general',
      discord_id: '1000', //'-256' should error but dont
    })
    assert.equal(result,await TEST.mockMessage('error.notRegistered',{type:'userError'},{name:'Creator'}))
  })

  it('barred user', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX',
      channel: 'general',
      discord_id: '-1', //'-256' should error but dont
    })
    assert.equal(result,await TEST.mockMessage('error.userBanned',{type:'userError'},{name:'Creator'}))
  })

  it('invalid difficulty', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX 31.4',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await TEST.mockMessage('clear.invalidDifficulty',{type:'userError'},{name:'Creator'}))
  })

  it('can\'t clear own level', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await TEST.mockMessage('clear.ownLevel',{type:'userError'},{name:'Creator'}))
  })

  it('basic clear', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,'<@128> \n ‣You have cleared \'level1\'  by Creator \n ‣You have earned 1 points')
  })

  it('clear with like', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX like',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,'<@128> \n ‣You have cleared \'level1\'  by Creator \n ‣You have earned 1 points\n ‣You also have liked this level ')
  })

  it('clear with invalid parameters', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX llike',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,'You did not provide a valid difficulty vote ')
  })
  

  it('clear with difficulty', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX 5',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,'<@128> \n ‣You have cleared \'level1\'  by Creator \n ‣You have earned 1 points\n ‣You also have voted 5 as the difficulty for this level ')
  })

  it('remove difficulty', async function () {
    assert.equal(await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX 5 1',
      channel: 'general',
      discord_id: '128',
    }),'<@128> \n ‣You have cleared \'level1\'  by Creator \n ‣You have earned 1 points\n ‣You also have voted 5 as the difficulty for this level \n ‣You also have liked this level ');

    let play=await TEST.ts.db.Plays.query().where({code:1,player:1}).first()
    assert.exists(play)
    assert.equal(play.difficulty_vote,5)
    assert.equal(await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX 0 1',
      channel: 'general',
      discord_id: '128',
    }),'<@128> \n ‣You have already submitted a clear for \'level1\'  by Creator\n‣You have removed your difficulty vote for this level \n ‣You also have already liked this level ');
    play=await TEST.ts.db.Plays.query().where({code:1,player:1}).first()
    assert.exists(play)
    assert.isNull(play.difficulty_vote)
  })

  it('clear with like and difficulty', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX 5 like',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,'<@128> \n ‣You have cleared \'level1\'  by Creator \n ‣You have earned 1 points\n ‣You also have voted 5 as the difficulty for this level ')
  })

})