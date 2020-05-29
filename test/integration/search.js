describe('!search @curr', function () {
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
        },
        {
          level_name: 'user removed level',
          creator: 2,
          code: 'XXX-XXX-XX3',
          status: TEST.ts.LEVEL_STATUS.USER_REMOVED,
          difficulty: 0,
        },
        {
          level_name:
            'When he had to picnic on the beach, he purposely put sand in other people’s food.',
          creator: 2,
          code: 'XXX-XXX-XX4',
          status: 1,
          difficulty: 1,
        },
        {
          level_name:
            'I am happy to take your donation; any amount will be greatly appreciated.',
          creator: 2,
          code: 'XXX-XXX-XX5',
          status: 1,
          difficulty: 1,
        },
        {
          level_name:
            'Patricia loves the sound of nails strongly pressed against the chalkboard.',
          creator: 2,
          code: 'XXX-XXX-XX6',
          status: 1,
          difficulty: 1,
        },
        {
          level_name:
            'He found the end of the rainbow and was surprised at what he found there.',
          creator: 2,
          code: 'XXX-XXX-XX7',
          status: 1,
          difficulty: 1,
        },
        {
          level_name:
            "He looked behind the door and didn't like what he saw.",
          creator: 2,
          code: 'XXX-XXX-XX8',
          status: 1,
          difficulty: 1,
        },
        {
          level_name:
            'If eating three-egg omelets causes weight-gain, budgie eggs are a good substitute.',
          creator: 2,
          code: 'XXX-XXX-XX9',
          status: 1,
          difficulty: 1,
        },
        {
          level_name:
            'Stop waiting for exceptional things to just happen.',
          creator: 2,
          code: 'XXX-XXX-X10',
          status: 1,
          difficulty: 1,
        },
        {
          level_name:
            'The efficiency we have at removing trash has made creating trash more acceptable.',
          creator: 2,
          code: 'XXX-XXX-X11',
          status: 1,
          difficulty: 1,
        },
        {
          level_name:
            'All they could see was the blue water surrounding their sailboat.',
          creator: 2,
          code: 'XXX-XXX-X12',
          status: 1,
          difficulty: 1,
        },
        {
          level_name:
            'Chocolate covered crickets were his favorite snack.',
          creator: 2,
          code: 'XXX-XXX-X13',
          status: 1,
          difficulty: 1,
        },
        {
          level_name:
            'The three-year-old girl ran down the beach as the kite flew behind her.',
          creator: 2,
          code: 'XXX-XXX-X14',
          status: 1,
          difficulty: 1,
        },
        {
          level_name:
            'I like to leave work after my eight-hour tea-break.',
          creator: 2,
          code: 'XXX-XXX-X15',
          status: 1,
          difficulty: 1,
        },
        {
          level_name:
            'She opened up her third bottle of wine of the night.',
          creator: 2,
          code: 'XXX-XXX-X16',
          status: 1,
          difficulty: 1,
        },
        {
          level_name:
            "You've been eyeing me all day and waiting for your move like a lion stalking a gazelle in a savannah.",
          creator: 2,
          code: 'XXX-XXX-X17',
          status: 1,
          difficulty: 1,
        },
        {
          level_name: 'repeat repeat repeat',
          creator: 2,
          code: 'XXX-XXX-X18',
          status: 1,
          difficulty: 1,
        },
        {
          level_name: 'name_with_dashes',
          creator: 2,
          code: 'XXX-XXX-X19',
          status: 1,
          difficulty: 1,
        },
      ],
    });
  });

  it('no search', async function () {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!search',
        channel: 'general',
        discord_id: '256',
      }),
      "You didn't provide any search terms ",
    );
  });

  it('not found', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!search some unknown thing',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(result, '<@256> , we found 0 levels.');
  });

  it('success user removed not shown', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!search level',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      '<@256> , we found 2 levels.\n• `XXX-XXX-XXX` - "approved ***level***" by "Creator"\n• `XXX-XXX-XX2` - "pending ***level***" by "Creator"',
    );
  });

  it('partial', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!search lev',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      '<@256> , we found 2 levels.\n• `XXX-XXX-XXX` - "approved ***lev***el" by "Creator"\n• `XXX-XXX-XX2` - "pending ***lev***el" by "Creator"',
    );
  });

  it('more than 5', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!search the',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      '<@256> , we found 8 levels. Showing only 5 levels\n• `XXX-XXX-XX4` - "When he had to picnic on ***the*** beach, he purposely put sand in o***the***r people’s food." by "Creator"\n• `XXX-XXX-XX6` - "Patricia loves ***the*** sound of nails strongly pressed against ***the*** chalkboard." by "Creator"\n• `XXX-XXX-XX7` - "He found ***the*** end of ***the*** rainbow and was surprised at what he found ***the***re." by "Creator"\n• `XXX-XXX-XX8` - "He looked behind ***the*** door and didn\'t like what he saw." by "Creator"\n• `XXX-XXX-X11` - "***The*** efficiency we have at removing trash has made creating trash more acceptable." by "Creator"',
    );
  });

  it('multiple search terms', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!search the she',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      '<@256> , we found 1 level.\n• `XXX-XXX-X16` - "***She*** opened up her third bottle of wine of ***the*** night." by "Creator"',
    );
  });

  it('back to back', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!search re peat',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      '<@256> , we found 1 level.\n• `XXX-XXX-X18` - "***repeat*** ***repeat*** ***repeat***" by "Creator"',
    );
  });

  it('dashes', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!search dash',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      '<@256> , we found 1 level.\n• `XXX-XXX-X19` - "name\\_with\\_***dash***es" by "Creator"',
    );
  });
});
