describe('!atmebot',()=>{
  beforeEach(async () => {
    await TEST.setupData({
      Members: [{
        name: 'Mod',
        discord_id: '128',
        is_mod:1,
        atme:1,
      }, {
        name: 'Creator',
        discord_id: '256',
      }],
    });
  });

  it('!atme success', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!atmebot',
      channel: 'general',
      discord_id: '256',
    }),'<@256> You will be atted by Autobot ')
    const member=await TEST.ts.db.Members.query().where({discord_id:'256'}).first()
    assert.equal(member.atme,1)
  })

  it('!atme already', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!atmebot',
      channel: 'general',
      discord_id: '128',
    }),'You already have chosen to be atted ')
    const member=await TEST.ts.db.Members.query().where({discord_id:'128'}).first()
    assert.equal(member.atme,1)
  })

  it('!dontatme success', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!dontatmebot',
      channel: 'general',
      discord_id: '128',
    }),'<@128> You will not be atted by Autobot ')
    const member=await TEST.ts.db.Members.query().where({discord_id:'128'}).first()
    assert.notExists(member.atme)
  })

  it('!dontatme already', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!dontatmebot',
      channel: 'general',
      discord_id: '256',
    }),'You already have chosen not to be atted ')
    const member=await TEST.ts.db.Members.query().where({discord_id:'256'}).first()
    assert.notExists(member.atme)
  })

})