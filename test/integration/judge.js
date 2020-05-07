describe('!judge', function () {
  it('not mod', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!judge',
      channel: 'general',
      waitFor:100,
      discord_id: '256',
    })
    assert.lengthOf(result,0,"no result")
  })
})