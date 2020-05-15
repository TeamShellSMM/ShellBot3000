describe('!renamemember',()=>{
  beforeEach(async () => {
    await TEST.setupData({
      Members: [{
        name: 'Mod',
        discord_id: '128',
        is_mod:1,
      }, {
        name: 'Creator',
        maker_id:'123',
        maker_name:'Creator',
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

  it('not mod', async ()=>{
    assert.lengthOf(await TEST.mockBotSend({
      cmd: '!renamemember',
      channel: 'general',
      waitFor:100,
      discord_id: '256',
    }),0);
  })

  it('mod, no arguments', async ()=>{
    await TEST.ts.db.Members.query().patch({is_mod:1}).where({discord_id:128});
    assert.equal(await TEST.mockBotSend({
      cmd: '!renamemember',
      channel: 'general',
      waitFor:100,
      discord_id: '128',
    }),'No discord_id provided ');
  })

  it('mod, no new name', async ()=>{
    await TEST.ts.db.Members.query().patch({is_mod:1}).where({discord_id:128});
    assert.equal(await TEST.mockBotSend({
      cmd: '!renamemember 256',
      channel: 'general',
      waitFor:100,
      discord_id: '128',
    }),'You didn\'t give a new name ');
  })

  it('mod, no new name', async ()=>{
    await TEST.ts.db.Members.query().patch({is_mod:1}).where({discord_id:128});
    assert.equal(await TEST.mockBotSend({
      cmd: '!renamemember random_number new name',
      channel: 'general',
      waitFor:100,
      discord_id: '128',
    }),'No member found with discord_id `random_number` ');
  })

  
  it('mod, success', async ()=>{
    await TEST.ts.db.Members.query().patch({is_mod:1}).where({discord_id:128});
    assert.equal(await TEST.mockBotSend({
      cmd: '!renamemember 256 Other',
      channel: 'general',
      waitFor:100,
      discord_id: '128',
    }),'There is already another member with name "Other" ');
  })

  it('mod, success', async ()=>{
    await TEST.ts.db.Members.query().patch({is_mod:1}).where({discord_id:128});
    assert.equal(await TEST.mockBotSend({
      cmd: '!renamemember 256 a_new_name',
      channel: 'general',
      waitFor:100,
      discord_id: '128',
    }),'"Creator" has been renamed to "a_new_name"');
  })

})