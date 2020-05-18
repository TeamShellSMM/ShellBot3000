describe('misc-integration', () => {
  beforeEach(async () => {
    await TEST.setupData({
      Members: [
        {
          name: 'Mod',
          discord_id: '128',
          is_mod: 1,
        },
        {
          name: 'Creator',
          discord_id: '256',
        },
        {
          name: 'Other',
          discord_id: '512',
        },
      ],
      Levels: [
        {
          level_name: 'approved level',
          creator: 2,
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
        },
        {
          level_name: 'pending level',
          creator: 2,
          code: 'XXX-XXX-XX2',
          status: 0,
          difficulty: 0,
          tags: 'removetag1,tag2,removetag3,all_locked,remove_locked',
        },
        {
          level_name: 'pending level2',
          creator: 2,
          code: 'XXX-XXX-XX3',
          status: 0,
          difficulty: 0,
          tags: 'tag2',
        },
      ],
    });
  });

  it('!refresh', async () => {
    await TEST.ts.db.Members.query()
      .patch({ is_mod: 1 })
      .where({ discord_id: 128 });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!refresh',
        channel: 'general',
        discord_id: '128',
      }),
      'Reloaded data!',
    );
  });

  it('!commands', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!commands',
        channel: 'general',
        discord_id: '256',
      }),
      'You can find all the commands at <https://makerteams.net/features>',
    );
  });

  it('!random', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!random',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(result[1].title, 'approved level (XXX-XXX-XXX)');
  });

  it('!playersRandom', async () => {
    const result = await TEST.mockBotSend({
      cmd: '!playersRandom Mod,Other',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result[1].author.name,
      'Autobot rolled a d97 and found this level for Mod,Other',
    );
    assert.equal(result[1].title, 'approved level (XXX-XXX-XXX)');
  });

  /* 
  it('tscommand wrong guild', async (done)=>{
    const old=TEST.message.guild.id
    TEST.message.guild.id='invalid'
    const test=await TEST.mockBotSend({
      cmd: '!commands',
      channel: 'general',
      discord_id: '256',
    }).catch((e)=>{
      assert.instanceOf(e,Error)
      assert.equal(e.message,'yes')
    })
    TEST.message.guild.id=old  
    
  })

  */
});
