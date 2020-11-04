describe('!random / !playersRandom', function () {
  beforeEach(async () => {
    await TEST.setupData({
      Members: [
        {
          name: 'Mod',
          discord_id: '128',
        },
        {
          name: 'Creator',
          discord_id: '256',
        },
        {
          name: 'Banned',
          discord_id: '-1',
          is_banned: 1,
        },
      ],
      Levels: [
        {
          level_name: 'level1',
          creator: 2,
          code: 'XXX-XXX-XXX',
          status: 1,
          tags: 'tag1',
          difficulty: 1,
        },
        {
          level_name: 'level2',
          creator: 2,
          code: 'XXX-XXX-XX2',
          status: 0,
          difficulty: 0,
        },
        {
          level_name: 'level3',
          creator: 2,
          code: 'XXX-XXX-XX3',
          status: 1,
          difficulty: 1,
        },
      ],
    });
  });

  it('no players', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!playersRandom',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      'You have to enter at least one valid member name. ',
    );
  });

  it('no players', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!playersRandom 3',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      'No member with the name "3" was found in the members list. ',
    );
  });

  it('unknown player', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!playersRandom Mod,Other 1 10',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      'No member with the name "Other" was found in the members list. ',
    );
  });

  it('!random check difficulty min only', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!random 1',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      'You have ran out of levels in this range (1) ',
    );
  });

  it('!randomall', async function () {
    const random = sinon.stub(TEST.ts, 'getRandomInt');
    random.returns(0);
    const result = await TEST.mockBotSend({
      cmd: '!randomall',
      channel: 'general',
      discord_id: '128',
    });
    assert.deepInclude(result[1], { title: 'level1 (XXX-XXX-XXX)' });
    random.restore();
  });

  it('!random check difficulty swapped min and max', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!random 3 1',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      'You have ran out of levels in this range (1-3) ',
    );
  });

  it('!random check difficulty', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!random 1 3',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      'You have ran out of levels in this range (1-3) ',
    );
  });

  it('!randompending', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!randompending',
      channel: 'general',
      discord_id: '128',
    });
    assert.deepInclude(result[1], { title: 'level2 (XXX-XXX-XX2)' });
  });

  it('!randomtag nothing', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!randomtag',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(result, "You didn't give any tags ");
  });

  it('!randomtag no tags in db', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!randomtag smw',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(
      result,
      '`smw` is not a tag that has been whitelisted. ',
    );
  });

  it('!randomtag unknown tag and no similar tags', async function () {
    await TEST.ts.load();
    const result = await TEST.mockBotSend({
      cmd: '!randomtag smw',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(
      result,
      '`smw` is not a tag that has been whitelisted. ',
    );
  });
  it('!randomtag unknown tag but have similar tag', async function () {
    await TEST.ts.load();
    const result = await TEST.mockBotSend({
      cmd: '!randomtag tag2',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(
      result,
      '`tag2` is not a tag that has been whitelisted. ',
    );
  });

  it('!randomtag ran out of levels', async function () {
    await TEST.ts.load();
    const result = await TEST.mockBotSend({
      cmd: '!randomtag tag1',
      channel: 'general',
      discord_id: '256',
    });
    assert.equal(
      result,
      'You have ran out of levels in this range (0.5-10) with tags: tag1 ',
    );
  });

  it('!randomtag success', async function () {
    await TEST.ts.load();
    const result = await TEST.mockBotSend({
      cmd: '!randomtag tag1',
      channel: 'general',
      discord_id: '128',
    });
    assert.equal(result[0], '<@128> ');
    assert.deepInclude(result[1], {
      title: 'level1 (XXX-XXX-XXX)',
      description:
        'made by [Creator](http://localhost:8080/makerteam/maker/Creator)\n' +
        'Difficulty: 1, Clears: 0, Likes: 0\n' +
        'Tags: [tag1](http://localhost:8080/makerteam/levels/tags/tag1)\n',
      url: 'http://localhost:8080/makerteam/level/XXX-XXX-XXX',
    });
  });
});
