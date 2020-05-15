describe('misc-unit', function () {

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
      }],
    };

    await TEST.setupData(initData);
    TEST.ts.teamVariables['Minimum Point']=0;
    TEST.ts.teamVariables['New Level']=0;
  });


  it('Check team model loading without guild_id', async function () {
    //assert.isFalse(await TEST.ts.modOnly())
    const Teams=require('../../models/Teams')()
    assert.exists(Teams)
    assert.doesNotThrow(async ()=>await Teams.query().select())
  })

  it('Check TS.team no guild_id', async function () {
    //assert.isFalse(await TEST.ts.modOnly())
    assert.throws(()=>TEST.TS.teams('unregistered_guild_id'),Error,'This team, with guild id unregistered_guild_id has not yet setup it\'s config, buzzyS')
  })

  it('TS.message unfound string', async function () {
    //assert.isFalse(await TEST.ts.modOnly())
    assert.throws(()=>TEST.TS.message('unknown_string'),Error,'"unknown_string" message string was not found in ts.message')
  })

  it('TS.teamFromUrl unfound slug', async function () {
    //assert.isFalse(await TEST.ts.modOnly())
    assert.isFalse(TEST.TS.teamFromUrl('unknown_string'))
  })

  it('ts.discussionChannel no channel name',async ()=>{
    await TEST.ts.discussionChannel().catch((e)=>{
      assert(e instanceof TypeError)
      assert.equal(e.message,'undefined channel_name')
    })
  })

  it('ts.discussionChannel no parent category',async ()=>{
    await TEST.ts.discussionChannel('chanel-name')
    .catch((e)=>{
      assert.instanceOf(e,TypeError)
      assert.equal(e.message,'undefined parentID')
    })
  })

  it('ts.get_USER no discord_id ',async ()=>{
    await TEST.ts.get_user()
    .catch((e)=>{
      assert.instanceOf(e,TEST.TS.UserError)
      assert.equal(e.message,'We couldn\'t find your discord id')
    })
  })
  it('ts.updatePinned no parameters',async ()=>{
    await TEST.ts.updatePinned()
    .catch((e)=>{
      assert.instanceOf(e,TypeError)
      assert.equal(e.message,'channel_name undefined')
    })
    await TEST.ts.updatePinned('channel-name')
    .catch((e)=>{
      assert.instanceOf(e,TypeError)
      assert.equal(e.message,'embed not defined')
    })
  })

  it('ts.getWebUserError not user error',async ()=>{
    assert.deepEqual(await TEST.ts.getWebUserErrorMsg(new Error('not user error')),{ status: 'error', message: 'something went wrong buzzyS' })
  })

  it('ts.getUserError not user error',async ()=>{
    assert.deepEqual(await TEST.ts.getUserErrorMsg(new Error('not user error'),{
      content:'mock',
      author:{
        username:'mock',
      },
      channel:{
        id:1,
      },
    }),'something went wrong buzzyS')
  })
  
  it('ts.getExistingLevel removed',async ()=>{
    const level=await TEST.ts.getExistingLevel('XXX-XXX-XX5')
    .catch((e)=>{
      assert.instanceOf(e,TEST.TS.UserError)
      assert.equal(e.message,'The level \'removed level\'  has been removed from AutoTest\'s list')
    })
    assert.notExists(level)
  })

  it('ts.getExistingLevel wrong code, with suggestion',async ()=>{
    const level=await TEST.ts.getExistingLevel('XXX-XXX-XX')
    .catch((e)=>{
      assert.instanceOf(e,TEST.TS.UserError)
      assert.equal(e.message,'The code `XXX-XXX-XX` was not found in AutoTest\'s list. Did you mean:```\nXXX-XXX-XX1 - "pending level" by Creator```')
    })
    assert.notExists(level)
  })

  it('ts.getExistingLevel wrong code, with suggestion',async ()=>{
    const level=await TEST.ts.getExistingLevel()
    .catch((e)=>{
      assert.instanceOf(e,TEST.TS.UserError)
      assert.equal(e.message,'You did not give a level code')
    })
    assert.notExists(level)
  })
  

})