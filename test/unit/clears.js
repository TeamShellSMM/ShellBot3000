describe('clears', function () {
  before(async () => {
    await ts.setupData({
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

  it('no arguments', async function () {
    let result;
    try{
      result=await ts.clear({
        discord_id:'256',
      })
      assert(false,'not here')
    } catch(error){
      if(!error.errorType) throw error;
      assert.equal(error.errorType,"user")
      assert.equal(error.msg,ts.message('clear.noArgs'))
      const plays=await ts.db.Plays.query().select()
      assert.lengthOf(plays,0)
    }
  })

  it('can\'t clear own level', async function () {
    let result;
    try{
      result=await ts.clear({
        discord_id:'256',
        code:'xxx-xxx-xxx',
        completed:1,
      })
    } catch(error){
      if(!error.errorType) throw new Error(error)
      assert.equal(error.errorType,"user")
      assert.equal(error.msg,ts.message('clear.ownLevel'))
    }
    const plays=await ts.db.Plays.query().select()
    assert.lengthOf(plays,0)
  })
  it('succesful clear', async function () {
    let result;
    let discord_id='128'
    try{
      result=await ts.clear({
        discord_id,
        code:'xxx-xxx-xxx',
        completed:1,
      })
      const plays=await ts.db.Plays.query().select()
      assert.lengthOf(plays,1)
      assert.equal(plays[0].code,1)
      assert.equal(plays[0].player,1)
      assert.equal(plays[0].completed,1)
      assert.equal(plays[0].liked,0)

      const player=await ts.db.Members.query().where({ discord_id }).first()
      assert.isOk(player)
      assert.equal(player.clear_score_sum,1,"should have updated points")
      assert.equal(player.levels_cleared,1,"should have updated no. of levels cleared")
    } catch(error){
      throw new Error(error)
    }
  })
  it('succesful clear with like', async function () {
    await ts.clearTable('plays');
    await ts.recalculateAfterUpdate();
    let result;
    try{
      result=await ts.clear({
        discord_id:'128',
        code:'xxx-xxx-xxx',
        completed:'1',
        liked:'1',
      })
      const plays=await ts.db.Plays.query().select()
      assert.lengthOf(plays,1)
      assert.equal(plays[0].code,1)
      assert.equal(plays[0].player,1)
      assert.equal(plays[0].completed,1)
      assert.equal(plays[0].liked,1)
    } catch(error){
      throw new Error(error)
    }
  })
  it('succesful clear with like string', async function () {
    await ts.clearTable('plays');
    await ts.recalculateAfterUpdate();
    let result;
    try{
      result=await ts.clear({
        discord_id:'128',
        code:'xxx-xxx-xxx',
        completed:1,
        difficulty:'like',
      })
      const plays=await ts.db.Plays.query().select()
      assert.lengthOf(plays,1)
      assert.equal(plays[0].code,1)
      assert.equal(plays[0].player,1)
      assert.equal(plays[0].completed,1)
      assert.equal(plays[0].liked,1)
    } catch(error){
      throw new Error(error)
    }
  })
})