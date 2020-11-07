describe('!addtags,!removetags', () => {
  before(async () => {
    TEST.ts.teamVariables.whitelistedTagsOnly = 'false';
    await TEST.clearDb();
    await TEST.setupKnex({
      members: [
        {
          guild_id: 1,
          name: 'Mod',
          discord_id: '128',
          is_mod: 1,
        },
        {
          guild_id: 1,
          name: 'Creator',
          discord_id: '256',
        },
        {
          guild_id: 1,
          name: 'Other',
          discord_id: '512',
        },
      ],
      levels: [
        {
          guild_id: 1,
          level_name: 'approved level',
          creator: 2,
          code: 'XXX-XXX-XXX',
          status: 1,
          difficulty: 1,
        },
        {
          guild_id: 1,
          level_name: 'pending level',
          creator: 2,
          code: 'XXX-XXX-XX2',
          status: 0,
          difficulty: 0,
          tags: 'removetag1,tag2,removetag3,all_locked,remove_locked',
        },
        {
          guild_id: 1,
          level_name: 'pending level2',
          creator: 2,
          code: 'XXX-XXX-XX3',
          status: 0,
          difficulty: 0,
          tags: 'tag2',
        },
        {
          guild_id: 1,
          level_name: 'approved level',
          creator: 2,
          code: 'XXX-XXX-XX4',
          status: 1,
          difficulty: 1,
        },
        {
          guild_id: 1,
          level_name: 'approved level',
          creator: 2,
          code: 'XXX-XXX-XX5',
          status: 1,
          difficulty: 1,
        },
      ],
      tags: [
        {
          guild_id: 1,
          admin_id: 1,
          name: 'tag1',
          type: 'success',
          is_seperate: null,
          add_lock: null,
          remove_lock: null,
        },
        {
          guild_id: 1,
          admin_id: 1,
          name: 'tag2',
          type: 'success',
          is_seperate: null,
          add_lock: null,
          remove_lock: null,
        },
        {
          guild_id: 1,
          admin_id: 1,
          name: 'seperate',
          type: 'warning',
          is_seperate: 1,
          add_lock: null,
          remove_lock: null,
        },
        {
          guild_id: 1,
          admin_id: 1,
          name: 'all_locked',
          type: 'success',
          is_seperate: null,
          add_lock: 1,
          remove_lock: 1,
        },
        {
          guild_id: 1,
          admin_id: 1,
          name: 'remove_locked',
          type: 'success',
          is_seperate: null,
          add_lock: null,
          remove_lock: 1,
        },
      ],
    });
    await TEST.ts.load();
  });

  it('!addtag no code given', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!addtags',
        channel: 'general',
        discord_id: '256',
      }),
      `>>> **!addtags __<levelCode>__ <newTags>**\n${await TEST.mockMessageReply(
        'error.noCode',
        { type: 'userError', discord_id: 256 },
        {},
      )}`,
    );
  });

  it('!addtag no tags given', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!addtags xxx-xxx-xxx',
        channel: 'general',
        discord_id: '256',
      }),
      `>>> **!addtags <levelCode> __<newTags>__**\n${await TEST.mockMessageReply(
        'tags.noTags',
        { type: 'userError', discord_id: 256 },
        {},
      )}`,
    );
  });

  it('!addtag success', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!addtags xxx-xxx-xxx tag1,tag2,tag9',
        channel: 'general',
        discord_id: '256',
      }),
      '<@256> Tags added for "approved level" by "Creator" \nCurrent tags:```\ntag1\ntag2\ntag9```',
    );
    const tags = await TEST.knex('level_tags')
      .where({ guild_id: 1 })
      .where({ level_id: 1 });
    assert.deepEqual(
      tags.map((t) => t.tag_id),
      [1, 2, 8],
    );
  });

  it('!addtag in channel', async () => {
    const getChannel = sinon.stub(
      TEST.ts.discord,
      'messageGetChannelName',
    );

    await TEST.createChannel({
      name: 'XXX-XXX-XX4',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!addtags tag1,tag2,tag9',
        channel: 'XXX-XXX-XX4',
        discord_id: '256',
      }),
      '<@256> Tags added for "approved level" by "Creator" \nCurrent tags:```\ntag1\ntag2\ntag9```',
    );
    const tags = await TEST.knex('level_tags')
      .where({ guild_id: 1 })
      .where({ level_id: 1 });
    assert.deepEqual(
      tags.map((t) => t.tag_id),
      [1, 2, 8],
    );

    getChannel.restore();
  });

  it('!addtag whitelisted tags not mod', async () => {
    TEST.ts.teamVariables.whitelistedTagsOnly = 'true';
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!addtags xxx-xxx-xx5 tag1,tag2,tag3',
        channel: 'general',
        discord_id: '256',
      }),
      `>>> **!addtags <levelCode> __<newTags>__**\n${await TEST.mockMessageReply(
        'tags.whitelistedOnly',
        { type: 'userError', discord_id: 256 },
        { tag: 'tag3' },
      )}`,
    );
  });

  it('!addtag whitelisted tags mod', async () => {
    const modOnly = sinon.stub(TEST.ts, 'modOnly');
    modOnly.returns(true);
    TEST.ts.teamVariables.whitelistedTagsOnly = 'true';
    const result = await TEST.mockBotSend({
      cmd: '!addtags xxx-xxx-xx5 tag1,tag2,tag3',
      channel: 'general',
      discord_id: '128',
    });
    modOnly.restore();
    assert.equal(
      result,
      '>>> **!addtags <levelCode> __<newTags>__**\n<@128>, `tag3` is not a tag that has been whitelisted. ',
    );
  });

  it('!addtag success no existing tags', async () => {
    TEST.ts.teamVariables.whitelistedTagsOnly = 'false';
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!addtags xxx-xxx-xx5 tag1,tag2,tag3',
        channel: 'general',
        discord_id: '256',
      }),
      '<@256> Tags added for "approved level" by "Creator" \nCurrent tags:```\ntag1\ntag2\ntag3```',
    );
    const tags = await TEST.knex('level_tags')
      .where({ guild_id: 1 })
      .where({ level_id: 1 });
    assert.deepEqual(
      tags.map((t) => t.tag_id),
      [1, 2, 8],
    );
  });

  it('!addtag new-tag with space after comma', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!addtags xxx-xxx-xx5 tag1, new-tag',
        channel: 'general',
        discord_id: '256',
      }),
      '<@256> Tags added for "approved level" by "Creator" \nCurrent tags:```\ntag1\ntag2\ntag3\nnew-tag```',
    );
    const tags = await TEST.knex('level_tags')
      .where({ guild_id: 1 })
      .where({ level_id: 1 });
    assert.deepEqual(
      tags.map((t) => t.tag_id),
      [1, 2, 8],
    );
  });

  it('!addtag new-tag with 2 spaces after code', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!addtags xxx-xxx-xx5   new-tag2,tag1',
        channel: 'general',
        discord_id: '256',
      }),
      '<@256> Tags added for "approved level" by "Creator" \nCurrent tags:```\ntag1\ntag2\ntag3\nnew-tag\nnew-tag2```',
    );
    const tags = await TEST.knex('level_tags')
      .where({ guild_id: 1 })
      .where({ level_id: 1 });
    assert.deepEqual(
      tags.map((t) => t.tag_id),
      [1, 2, 8],
    );
  });

  it('!addtag none added', async () => {
    const reply = await TEST.mockBotSend({
      cmd: '!addtags XXX-XXX-XX2 tag2',
      channel: 'general',
      discord_id: '256',
    });
    const tags = await TEST.knex('level_tags')
      .where({ guild_id: 1 })
      .where({ level_id: 2 });
    assert.deepEqual(
      tags.map((t) => t.tag_id),
      [6, 2, 7, 4, 5],
    );
    assert.equal(
      reply,
      'No new tags added for "pending level" by "Creator"\nCurrent tags:```\nremovetag1\ntag2\nremovetag3\nall_locked\nremove_locked``` ',
    );
  });

  it("!addtag can't add locked tag", async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!addtags XXX-XXX-XXX all_locked',
        channel: 'general',
        discord_id: '256',
      }),
      "You can't add the tag 'all_locked' ",
    );
  });

  it('!removetag success', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!removetags XXX-XXX-XX2 removetag1,removetag3',
        channel: 'general',
        discord_id: '256',
      }),
      '<@256> Tags removed for "pending level" by "Creator "\nCurrent tags:```\ntag2\nall_locked\nremove_locked```',
    );
    const tags = await TEST.knex('level_tags')
      .where({ guild_id: 1 })
      .where({ level_id: 2 });
    assert.deepEqual(
      tags.map((t) => t.tag_id),
      [2, 4, 5],
    );
  });

  it('!removetag success by mod', async () => {
    const modOnly = sinon.stub(TEST.ts, 'modOnly');
    modOnly.returns(true);
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!removetags XXX-XXX-XX2 tag2',
        channel: 'general',
        discord_id: '128',
      }),
      '<@128> Tags removed for "pending level" by "Creator "\nCurrent tags:```\nall_locked\nremove_locked```',
    );
    const tags = await TEST.knex('level_tags')
      .where({ guild_id: 1 })
      .where({ level_id: 2 });
    assert.deepEqual(
      tags.map((t) => t.tag_id),
      [4, 5],
    );
    modOnly.restore();
  });

  it('!removetag fail by other player', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!removetags XXX-XXX-XX2 removetag1,removetag3',
        channel: 'general',
        discord_id: '512',
      }),
      'You can\'t remove tags from "pending level" by "Creator" ',
    );
    const tags = await TEST.knex('level_tags')
      .where({ guild_id: 1 })
      .where({ level_id: 2 });
    assert.deepEqual(
      tags.map((t) => t.tag_id),
      [4, 5],
    );
  });

  it('!removetag none', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!removetags XXX-XXX-XX2 removetag2',
        channel: 'general',
        discord_id: '256',
      }),
      'No tags have been removed for "pending level" by "Creator"\nCurrent tags:```\nall_locked\nremove_locked``` ',
    );
  });

  it("!removetag can't remove locked tag", async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!removetags XXX-XXX-XX2 remove_locked',
        channel: 'general',
        discord_id: '256',
      }),
      'You can\'t remove the tag "remove_locked" ',
    );
  });
});
