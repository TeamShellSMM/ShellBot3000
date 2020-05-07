describe('!ammendcode', function () {
  beforeEach(async () => {
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

  it('no arguments', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,await TEST.mockMessage('reupload.noOldCode',{type:'userError'},{name:'Creator'}))
  })

  it('no new level code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,await TEST.mockMessage('reupload.noOldCode',{type:'userError'},{name:'Creator'}))
  })

  it('invalid old code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xx-xxx XXX-XXX-XXX',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,await TEST.mockMessage('reupload.invalidOldCode',{type:'userError'},{name:'Creator'}))
  })

  it('invalid new code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx XXX-XX-XXX',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,await TEST.mockMessage('reupload.invalidNewCode',{type:'userError'},{name:'Creator'}))
  })

  it('same code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx XXX-XXX-XXX',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,await TEST.mockMessage('reupload.sameCode',{type:'userError'},{name:'Creator'}))
  })

  it('new code is existing level', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx XXX-XXx-XX2',
      channel: 'general',
      discord_id: '128',
    })
    assert.equal(result,await TEST.mockMessage('add.levelExisting',{type:'userError'},{level:{
      level_name: 'pending level',
      creator: 'Creator',
      code: 'XXX-XXX-XX2',
      status: 0,
      difficulty: 0,
    }}))
  })

  it('not mod', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx xxx-xxx-xx3',
      channel: 'general',
      waitFor:100,
      discord_id: '256',
    })
    assert.lengthOf(result,0,"no result")
  })

  it('owner succesful', async function () {
    const ownerId=TEST.ts.getGuild().owner.user.id
    await TEST.clearChannels();
    await TEST.createChannel({
      name:'XXX-XXX-XXX',
      parent:TEST.ts.channels.levelDiscussionCategory,
    })
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx xxx-xxx-xx3',
      channel: 'general',
      discord_id: ownerId,
    })
    assert.equal(result,await TEST.mockMessage('ammendCode.success',{type:'normal'},{
      level:{
        level_name: 'approved level',
        creator: 'Creator',
        code: 'XXX-XXX-XXX',
        status: 1,
        difficulty: 1,
      },
    old_code:'XXX-XXX-XXX',new_code:'XXX-XXX-XX3'}))
    const old_level=await TEST.ts.db.Levels.query().where({code:'XXX-XXX-XXX'}).first()
    const new_level=await TEST.ts.db.Levels.query().where({code:'XXX-XXX-XX3'}).first()
    assert.notExists(old_level)
    assert.exists(new_level)

    assert.notExists(await TEST.findChannel({
      name:'XXX-XXX-XXX',
      parentID:TEST.ts.channels.levelDiscussionCategory
    }),"old channel doesn't exist");

    assert.exists(await TEST.findChannel({
      name:'XXX-XXX-XX3',
      parentID:TEST.ts.channels.levelDiscussionCategory,
    }),"next channel should exist");
  })
  it('discord admin, with no flag', async function () {
    delete TEST.ts.teamVariables.discordAdminCanMod
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx xxx-xxx-xx3',
      channel: 'general',
      waitFor:100,
      discord_id: TEST.bot_id, //we use bot for now as bot was set to have admin rights in test server
      //TODO: make admin test users
    })
    assert.lengthOf(result,0,"no result")
  })

  it('discord admin, with flags', async function () {
    TEST.ts.teamVariables.discordAdminCanMod='yes'
    const result = await TEST.mockBotSend({
      cmd: '!ammendcode xxx-xxx-xxx xxx-xxx-xx3',
      channel: 'general',
      discord_id: TEST.bot_id, //we use bot for now as bot was set to have admin rights in test server
      //TODO: make admin test users
    })
    assert.equal(result,await TEST.mockMessage('ammendCode.success',{type:'normal'},{
      level:{
        level_name: 'approved level',
        creator: 'Creator',
        code: 'XXX-XXX-XXX',
        status: 1,
        difficulty: 1,
      },
      old_code:'XXX-XXX-XXX',new_code:'XXX-XXX-XX3'}))
  })

})