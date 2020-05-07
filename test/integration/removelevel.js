describe('!removelevel', function () {
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

  it('Removed by creator', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!removelevel XXX-XXX-XXX long reason',
      channel: 'general',
      waitFor:100,
      discord_id: '256',
    })
    assert.equal(result[1],'<@256> You have removed "approved level" by Creator ')
    const level=await TEST.ts.db.Levels.query().where({code:'XXX-XXX-XXX'}).first()
    assert.exists(level)
    assert.equal(level.status,TEST.ts.LEVEL_STATUS.USER_REMOVED)
  })

  it('removed by mod', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!removelevel XXX-XXX-XXX long reason',
      channel: 'general',
      waitFor:100,
      discord_id: '128',
    })
    assert.equal(result[2],'<@128> You have removed "approved level" by Creator ')
    const level=await TEST.ts.db.Levels.query().where({code:'XXX-XXX-XXX'}).first()
    assert.exists(level)
    assert.equal(level.status,TEST.ts.LEVEL_STATUS.REMOVED)
  })

})