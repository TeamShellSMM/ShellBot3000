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

  it('clear with difficulty', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear XXX-XXX-XXX 5',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,'<@128> \n ‣You have cleared \'level1\'  by Creator \n ‣You have earned 1 points\n ‣You also have voted 5 as the difficulty for this level ')
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