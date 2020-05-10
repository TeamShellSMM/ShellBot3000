describe('!addtags,!removetags',()=>{
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
        name: 'Other',
        discord_id: '512',
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
        tags:'removetag1,tag2,removetag3,all_locked,remove_locked',
      },{
        level_name: 'pending level2',
        creator: 2,
        code: 'XXX-XXX-XX3',
        status: 0,
        difficulty: 0,
        tags:'tag2',
      }],
    });
  });

  it('!addtag no code given', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!addtags',
      channel: 'general',
      discord_id: '256',
    }),'You did not give a level code ');
  })

  it('!addtag no tags given', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!addtags xxx-xxx-xxx',
      channel: 'general',
      discord_id: '256',
    }),'You didn\'t give any tags ');
  })


  it('!addtag success', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!addtags xxx-xxx-xxx tag1,tag2,tag3',
      channel: 'general',
      discord_id: '256',
    }),'<@256> Tags added for "approved level" by "Creator "\nCurrent tags:```\ntag1\ntag2\ntag3```')
    const level=await TEST.ts.db.Levels.query().where({code:'XXX-XXX-XXX'}).first()
    assert.equal(level.tags,'tag1,tag2,tag3')
  })

  it('!addtag none added', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!addtags XXX-XXX-XX2 tag2',
      channel: 'general',
      discord_id: '256',
    }),'No new tags added for "pending level" by "Creator"\nCurrent tags:```\nremovetag1\ntag2\nremovetag3\nall_locked\nremove_locked``` ')
  })

  it('!addtag can\'t add locked tag', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!addtags XXX-XXX-XXX all_locked',
      channel: 'general',
      discord_id: '256',
    }),'You can\'t add the tag \'all_locked\' ')
  })

  it('!removetag success', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!removetags XXX-XXX-XX2 removetag1,removetag3',
      channel: 'general',
      discord_id: '256',
    }),'<@256> Tags removed for "pending level" by "Creator "\nCurrent tags:```\ntag2\nall_locked\nremove_locked```')
    const level=await TEST.ts.db.Levels.query().where({code:'XXX-XXX-XX2'}).first()
    assert.equal(level.tags,'tag2,all_locked,remove_locked')
  })

  it('!removetag success by mod', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!removetags XXX-XXX-XX2 removetag1,removetag3',
      channel: 'general',
      discord_id: '128',
    }),'<@128> Tags removed for "pending level" by "Creator "\nCurrent tags:```\ntag2\nall_locked\nremove_locked```')
    const level=await TEST.ts.db.Levels.query().where({code:'XXX-XXX-XX2'}).first()
    assert.equal(level.tags,'tag2,all_locked,remove_locked')
  })

  it('!removetag fail by other player', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!removetags XXX-XXX-XX2 removetag1,removetag3',
      channel: 'general',
      discord_id: '512',
    }),'You can\'t remove tags from "pending level" by "Creator" ')
    const level=await TEST.ts.db.Levels.query().where({code:'XXX-XXX-XX2'}).first()
    assert.equal(level.tags,'removetag1,tag2,removetag3,all_locked,remove_locked')
  })

  it('!removetag none', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!removetags XXX-XXX-XX2 removetag2',
      channel: 'general',
      discord_id: '256',
    }),'No tags have been removed for "pending level" by "Creator"\nCurrent tags:```\nremovetag1\ntag2\nremovetag3\nall_locked\nremove_locked``` ')
  })

  it('!removetag can\'t remove locked tag', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!removetags XXX-XXX-XX2 remove_locked',
      channel: 'general',
      discord_id: '256',
    }),'You can\'t remove the tag "remove_locked" ')
  })


})