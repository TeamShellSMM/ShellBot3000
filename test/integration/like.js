describe('!like', function () {
  before(async () => {
    await TEST.setupData({
      Members: [{
        name: 'Mod',
        discord_id: '128',
        is_mod:1,
      }, {
        name: 'Creator',
        discord_id: global.TEST.userBot,
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

  it('check like', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!like XXX-XXX-XXX',
      channel: 'general',
      waitFor:100,
      discord_id: '128',
    })
    assert.equal(result,'<@128> \n ‣You have liked \'approved level\'  by Creator ')
  })
})