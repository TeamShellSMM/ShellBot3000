describe('!clears', function () {
  beforeEach(async () => {
    await TEST.setupData({
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

  it('no level code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await TEST.mockMessage('error.noCode',{type:'userError'},{name:'Creator'}))
  })

  it('no level code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!clear',
      channel: 'general',
      discord_id: '256',
    })
    assert.equal(result,await TEST.mockMessage('error.noCode',{type:'userError'},{name:'Creator'}))
  })

})