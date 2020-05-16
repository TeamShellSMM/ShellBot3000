describe('!refusefix @curr', function () {
  beforeEach(async () => {
    const initData={
      Members: [ {
        name: 'Creator',
        discord_id: '64',
      },{
        name: 'Mod1',
        discord_id: '128',
        is_mod:1,
      },{
        name: 'Another Creator',
        discord_id: '256',
      }],
      Levels: [{
        level_name: 'pending level',
        creator: 1,
        code: 'XXX-XXX-XX1',
        status: TEST.ts.LEVEL_STATUS.PENDING,
        difficulty: 0,
      },{
        level_name: 'approved level',
        creator: 1,
        code: 'XXX-XXX-XX2',
        status: TEST.ts.LEVEL_STATUS.APPROVED,
        difficulty: 5,
      },{
        level_name: 'need fix level',
        creator: 1,
        code: 'XXX-XXX-XX3',
        status: TEST.ts.LEVEL_STATUS.NEED_FIX,
        difficulty: 0,
      },{
        level_name: 'removed level',
        creator: 1,
        code: 'XXX-XXX-XX5',
        status: TEST.ts.LEVEL_STATUS.REMOVED,
        difficulty: 1,
      },{
        level_name: 'user removed level',
        creator: 1,
        code: 'XXX-XXX-XX6',
        status: TEST.ts.LEVEL_STATUS.REMOVED,
        difficulty: 1,
      },{
        level_name: 'free approved level',
        creator: 1,
        code: 'XXX-XXX-XX7',
        status: TEST.ts.LEVEL_STATUS.APPROVED,
        difficulty: 5,
        is_free_submission:1,
      },{
        level_name: 'Another creator\'s level',
        creator: 2,
        code: 'XXX-XXX-XX8',
        status: TEST.ts.LEVEL_STATUS.PENDING,
        difficulty: 0,
      },{
        level_name: 'Already reuploaded code',
        creator: 1,
        code: 'XXX-XXX-XX9',
        new_code:'XXX-XXX-X10',
        status: TEST.ts.LEVEL_STATUS.REUPLOADED,
        difficulty: 0,
      },{
        level_name: 'User removed',
        creator: 1,
        code: 'XXX-XXX-X11',
        status: TEST.ts.LEVEL_STATUS.USER_REMOVED,
        difficulty: 2,
      },{
        level_name: 'User removed neex fix',
        creator: 1,
        code: 'XXX-XXX-X12',
        status: TEST.ts.LEVEL_STATUS.USER_REMOVED,
        old_status:TEST.ts.LEVEL_STATUS.NEED_FIX,
        difficulty: 2,
      },{
        level_name: 'refused fix level',
        creator: 1,
        code: 'XXX-XXX-X13',
        status: TEST.ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD,
        difficulty: 2,
      }],
    };

    await TEST.setupData(initData);
    TEST.ts.teamVariables['Minimum Point']=0;
    TEST.ts.teamVariables['New Level']=0;
  });

  it('nothing given',async()=>{
    const result = await TEST.mockBotSend({
      cmd: '!refusefix',
      channel: 'general',
      discord_id: '64',
    })
    assert.equal(result,'You did not provide a valid code for the level ')
  })

  it('no reason',async()=>{
    const result = await TEST.mockBotSend({
      cmd: '!refusefix XXX-XXX-XX3',
      channel: 'general',
      discord_id: '64',
    })
    assert.equal(result,'Please provide a little message to the mods for context at the end of the command! ')
  })

  it('not need fix',async()=>{
    const result = await TEST.mockBotSend({
      cmd: '!refusefix XXX-XXX-XX1 do not want',
      channel: 'general',
      discord_id: '64',
    })
    assert.equal(result,'This level is not currently in a fix request! ')
  })

  

  it('not creator',async()=>{    
    await TEST.clearChannels()
    assert.equal(await TEST.mockBotSend({
      cmd: '!refusefix XXX-XXX-XX3 long reason',
      channel: 'general',
      discord_id: '256',
    }),'You can only use this command on one of your own levels that currently has an open fix request. ')
  })

  it('already refusedfix',async()=>{    
    await TEST.clearChannels()
    assert.equal(await TEST.mockBotSend({
      cmd: '!refusefix XXX-XXX-X13 long reason',
      channel: 'general',
      discord_id: '64',
    }),'You already sent this reupload request back! ')
  })

  it('creator successful refusefix',async()=>{    
    await TEST.clearChannels()
    assert.equal(await TEST.mockBotSend({
      cmd: '!refusefix XXX-XXX-XX3 long reason',
      channel: 'general',
      discord_id: '64',
    }),'Your level was put in the reupload queue, we\'ll get back to you in a bit!')

    const level=await TEST.ts.db.Levels.query().where({code:'XXX-XXX-XX3'}).first();
    assert.equal(level.status,TEST.ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD)
    assert.exists(await TEST.findChannel({
      name:'XXX-XXX-XX3',
      parentID:TEST.ts.channels.pendingReuploadCategory
    }),"should be here");

    


  })

})