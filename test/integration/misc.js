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

  it('!refresh', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!refresh',
      channel: 'general',
      discord_id: '256',
    }),'Reloaded data!');
  })

  it('!commands', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!commands',
      channel: 'general',
      discord_id: '256',
    }),'You can find all the commands at <https://makerteams.net/features>');
  })

})