describe('!fixapprove', function () {
  beforeEach(async () => {
    await TEST.clearChannels();
    await TEST.setupData({
      Members: [ {
        name: 'Creator',
        discord_id: '64',
      },{
        name: 'Mod1',
        discord_id: '128',
        is_mod:1,
      }],
      Levels: [{
        level_name: 'need fix reupload',
        creator: 1,
        code: 'XXX-XXX-XXX',
        status: TEST.ts.LEVEL_STATUS.PENDING_FIXED_REUPLOAD,
        difficulty: 0,
      },{
        level_name: 'rejected',
        creator: 1,
        code: 'XXX-XXX-XX2',
        status: TEST.ts.LEVEL_STATUS.REJECTED,
        difficulty: 0,
      },{
        level_name: 'approved reuploaded',
        creator: 1,
        code: 'XXX-XXX-XX3',
        status: TEST.ts.LEVEL_STATUS.PENDING_APPROVED_REUPLOADED,
        difficulty: 0,
      }],
      PendingVotes:[{
        player:2,
        code:1,
        type:"fix",
        difficulty_vote:2,
        reason:'It\'s a bit janky innit',
      },{
        player:2,
        code:3,
        type:"approve",
        difficulty_vote:2,
        reason:'Is good',
      }],
    });
  });

  it('approve',async ()=>{
    await TEST.createChannel({
      name:'XXX-XXX-XXX',
      parent:TEST.ts.channels.pendingReupload,
    })
    const result = await TEST.mockBotSend({
      cmd: '!fixapprove "that was a fix."',
      channel: 'XXX-XXX-XXX',
      discord_id: '128',
    })
    assert.equal(result[1].fields[0].name,'Mod1 voted for approval with difficulty 2:')
    const votes=await TEST.ts.db.PendingVotes.query().where({code:1}).first()
    assert.equal(votes.type,'approve')
    const level=await TEST.ts.db.Levels.query().where({code:'XXX-XXX-XXX'}).first()
    assert.isOk(level)
    assert.equal(level.code,'XXX-XXX-XXX')
    assert.equal(level.status,TEST.ts.LEVEL_STATUS.APPROVED)
  })

  it('approve',async ()=>{
    await TEST.createChannel({
      name:'XXX-XXX-XX3',
      parent:TEST.ts.channels.pendingReupload,
    })
    const result = await TEST.mockBotSend({
      cmd: '!fixapprove',
      channel: 'XXX-XXX-XX3',
      discord_id: '128',
    })
    assert.equal(result[1].fields[0].name,'Mod1 voted for approval with difficulty 2:')
    const level=await TEST.ts.db.Levels.query().where({code:'XXX-XXX-XX3'}).first()
    assert.isOk(level)
    assert.equal(level.status,TEST.ts.LEVEL_STATUS.APPROVED)
  })
})