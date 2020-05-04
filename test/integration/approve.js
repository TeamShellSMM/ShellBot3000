describe('!approve', function () {
  before(async () => {
    await ts.setupData({
      Members: [ {
        name: 'Creator',
        discord_id: '64',
      },{
        name: 'Mod1',
        discord_id: '128',
      }, {
        name: 'Mod2',
        discord_id: '256',
      }, {
        name: 'Mod3',
        discord_id: '512',
      }],
      Levels: [{
        level_name: 'level1',
        creator: 1,
        code: 'XXX-XXX-XXX',
        status: 0,
        difficulty: 0,
      }],
    });
  });

  it('approve', async function () {
    const result = await mockBotSend({
      cmd: '!approve XXX-XXX-XXX 5 "is good level"',
      channel: ts.channels.modChannel,
      discord_id: '256',
    })
    assert.equal(result,await ts.mockMessage('error.noCode',{type:'userError'},{name:'Creator'}))
  })
  it('judge', async function () {
    const result = await mockBotSend({
      cmd: '!judge',
      channel: 'XXX-XXX-XXX',
      discord_id: '256',
    })
    assert.equal(result,await ts.mockMessage('error.noCode',{type:'userError'},{name:'Creator'}))
  })
  /*
  it('no arguments', async function () {
    const result = await mockBotSend({
      cmd: '!add xxx-xxx-xxx',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await ts.mockMessage('add.noName',{type:'userError'},{name:'Creator'}))
  })
  it('adding existing', async function () {
    const result = await mockBotSend({
      cmd: '!add xxx-xxx-xxx long name',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await ts.mockMessage('add.levelExisting',{type:'userError'},{level:{
      level_name:'level1',
      code:'XXX-XXX-XXX',
      creator:'Creator',
    }}))
  })
  it('no code', async function () {
    const result = await mockBotSend({
      cmd: '!add long name',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await ts.mockMessage('error.invalidCode',{type:'userError'},{
      level_name:'',
      code:'XXX-XXX-XXX',
      creator:'Creator',
    }))
  })

  it('successful', async function () {
    const result = await mockBotSend({
      cmd: '!add XXX-XXX-XX4 long name',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await ts.mockMessage('add.success',{type:'registeredSuccess',discord_id:'256'},{
      level_name:'long name',
      code:'XXX-XXX-XX4',
    }))
    const levels=await ts.getLevels();
    assert.lengthOf(levels,4)
    assert.equal(levels[3].code,'XXX-XXX-XX4')
    assert.equal(levels[3].creator,'Creator')
    assert.equal(levels[3].status,0)
    assert.equal(levels[3].difficulty,0)
  })

  it('no points', async function () {
    await ts.clearTable('levels');
    ts.teamVariables['Minimum Point']=10
    await ts.recalculateAfterUpdate();
    const result = await mockBotSend({
      cmd: '!add XXX-XXX-XX4 long name',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await ts.mockMessage('add.success',{type:'registeredSuccess',discord_id:'256'},{
      level_name:'long name',
      code:'XXX-XXX-XX4',
    }))
    const levels=await ts.getLevels();
    assert.lengthOf(levels,4)
    assert.equal(levels[3].code,'XXX-XXX-XX4')
    assert.equal(levels[3].creator,'Creator')
    assert.equal(levels[3].status,0)
    assert.equal(levels[3].difficulty,0)
  })
*/
})