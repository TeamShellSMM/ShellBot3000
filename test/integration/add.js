describe('!add', function () {
  before(async () => {
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
      cmd: '!add',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await TEST.mockMessage('error.noCode',{type:'userError'},{name:'Creator'}))
  })
  it('no level name', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!add xxx-xxx-xxx',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await TEST.mockMessage('add.noName',{type:'userError'},{name:'Creator'}))
  })
  it('invalid code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!add xx-xxx-xxx',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await TEST.mockMessage('error.invalidCode',{type:'userError'},{code:'XX-XXX-XXX'}))
  })

  
  it('adding existing', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!add xxx-xxx-xxx long name',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await TEST.mockMessage('add.levelExisting',{type:'userError'},{level:{
      level_name:'level1',
      code:'XXX-XXX-XXX',
      creator:'Creator',
    }}))
  })
  it('no code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!add long name',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await TEST.mockMessage('error.invalidCode',{type:'userError'},{
      level_name:'',
      code:'XXX-XXX-XXX',
      creator:'Creator',
    }))
  })

  it('successful', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!add XXX-XXX-XX4 long name',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await TEST.mockMessage('add.success',{type:'registeredSuccess',discord_id:'256'},{
      level_name:'long name',
      code:'XXX-XXX-XX4',
    }))
    const levels=await TEST.ts.getLevels();
    assert.lengthOf(levels,4)
    assert.equal(levels[3].code,'XXX-XXX-XX4')
    assert.equal(levels[3].creator,'Creator')
    assert.equal(levels[3].status,0)
    assert.equal(levels[3].difficulty,0)
  })

  it('adding level name with special discord strings, <@at>=reject', async function () {
    assert.deepEqual(await TEST.mockBotSend({
      cmd: '!add XXX-XXX-XX4 house of <@80351110224678912>',
      channel: 'general',
      discord_id: '512',
    }),await TEST.mockMessage('error.specialDiscordString',{type:'userError'}))
  })

  it('no points', async function () {
    await TEST.clearTable('levels');
    TEST.ts.teamVariables['Minimum Point']=10
    await TEST.ts.recalculateAfterUpdate();
    const result = await TEST.mockBotSend({
      cmd: '!add XXX-XXX-XX4 long name',
      channel: 'general',
      discord_id: '256',
    })
    const player=await TEST.ts.get_user('256')
    assert.equal(result,await TEST.mockMessage('points.cantUpload',{type:'userError',discord_id:'256'},{
      points_needed:player.earned_points.pointsNeeded
    }))
    const levels=await TEST.ts.getLevels();
    assert.lengthOf(levels,0)
  })

  it('Submit SMM1 code with allowSMM1 flag off', async function () {
    TEST.ts.teamVariables.allowSMM1=null
    TEST.ts.teamVariables['Minimum Point']=0
    const result = await TEST.mockBotSend({
      cmd: '!add 0791-0000-03DD-2D52 The Ultimate Road of Shell',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await TEST.mockMessage('error.invalidCode',{type:'userError'},{code:'0791-0000-03DD-2D52'}))
  })

  it('Submit SMM1 code with allowSMM1 flag on', async function () {
    TEST.ts.teamVariables.allowSMM1='true'
    const result = await TEST.mockBotSend({
      cmd: '!add 0791-0000-03DD-2D52 The Ultimate Road of Shell',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,await TEST.mockMessage('add.success',{type:'registeredSuccess',discord_id:'128'},{
      level_name:'The Ultimate Road of Shell',
      code:'0791-0000-03DD-2D52',
    }))
    const levels=await TEST.ts.getLevels();
    assert.lengthOf(levels,1)
    assert.equal(levels[0].code,'0791-0000-03DD-2D52')
    assert.equal(levels[0].creator,'Mod')
    assert.equal(levels[0].status,0)
    assert.equal(levels[0].difficulty,0)
  })

})