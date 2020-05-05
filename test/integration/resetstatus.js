describe('!resetstatus', function () {
  before(async () => {
    await ts.setupData({
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
    const result = await mockBotSend({
      cmd: '!resetstatus',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,await ts.mockMessage('error.noCode',{type:'userError'},{name:'Creator'}))
  })

  it('not mod', async function () {
    const result = await mockBotSend({
      cmd: '!resetstatus xxx-xxx-xxx',
      channel: 'general',
      discord_id: '256',
    })
    assert.lengthOf(result,0,"no result")
  })

  it('mod succesful', async function () {
    const result = await mockBotSend({
      cmd: '!resetstatus xxx-xxx-xxx',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,await ts.mockMessage('resetStatus.succesful',{type:'normal'},{
      level_name: 'level1',
      creator: 'Creator',
      code: 'XXX-XXX-XXX',
      status: 1,
      difficulty: 1,
    }))
    const level=await ts.db.Levels.query().where({code:'XXX-XXX-XXX'}).first()
    console.log(level)
    assert.equal(level.status,0)
  })

})