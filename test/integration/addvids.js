describe('!add/remove vids',()=>{
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
        videos:'https://youtube.com,https://twitch.tv',
      }],
    });
  });

  it('!addvid success', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!addvids xxx-xxx-xxx https://youtube.com,https://clips.twitch.tv',
      channel: 'general',
      discord_id: '256',
    }),'<@256> Clear videos added for "approved level" by "Creator" \nCurrent videos:```\nhttps://youtube.com\nhttps://clips.twitch.tv```')
  })
  
  it('!addvid success, delimited with \\n', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!addvids xxx-xxx-xxx \nhttps://youtube.com\nhttps://clips.twitch.tv',
      channel: 'general',
      discord_id: '256',
    }),'<@256> Clear videos added for "approved level" by "Creator" \nCurrent videos:```\nhttps://youtube.com\nhttps://clips.twitch.tv```')
  })

  it('!addvid success, delimited with space', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!addvids xxx-xxx-xxx https://youtube.com https://clips.twitch.tv',
      channel: 'general',
      discord_id: '256',
    }),'<@256> Clear videos added for "approved level" by "Creator" \nCurrent videos:```\nhttps://youtube.com\nhttps://clips.twitch.tv```')
  })

  it('!addvid no code', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!addvids',
      channel: 'general',
      discord_id: '256',
    }),'You did not give a level code ')
  })
  
  it('!addvid no vids', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!addvids xxx-xxx-xxx',
      channel: 'general',
      discord_id: '256',
    }),'You didn\'t give any links ')
  })
  

  it('!addvid not valid url', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!addvids XXX-XXX-XX2 example of not url',
      channel: 'general',
      discord_id: '256',
    }),'The links below didn\'t look like urls: ```\nexample\nof\nnot\nurl``` ')
  })

  it('!addvid none added', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!addvids XXX-XXX-XX2 https://youtube.com',
      channel: 'general',
      discord_id: '256',
    }),'No new clear video added for "pending level" by CreatorCurrent videos:```\nhttps://youtube.com\nhttps://twitch.tv``` ')
  })

  it('!removevid success', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!removevids XXX-XXX-XX2 https://youtube.com',
      channel: 'general',
      discord_id: '256',
    }),'<@256> Clear videos removed for "pending level" by "Creator" \nCurrent videos:```\nhttps://twitch.tv```')
  })

  it('!removevid success by mod', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!removevids XXX-XXX-XX2 https://youtube.com',
      channel: 'general',
      discord_id: '128',
    }),'<@128> Clear videos removed for "pending level" by "Creator" \nCurrent videos:```\nhttps://twitch.tv```')
  })

  it('!removevid fail by other player', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!removevids XXX-XXX-XX2 https://youtube.com',
      channel: 'general',
      discord_id: '512',
    }),'You can\'t remove videos from "pending level" by "Creator" ')
  })

  it('!removevid none', async ()=>{
    assert.equal(await TEST.mockBotSend({
      cmd: '!removevids XXX-XXX-XX2 https://clips.twitch.tv',
      channel: 'general',
      discord_id: '256',
    }),'No videos have been removed for "pending level" by "Creator"\nCurrent videos:```\nhttps://youtube.com\nhttps://twitch.tv``` ')
  })

})