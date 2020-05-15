describe('misc-unit', function () {

  

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

})