describe('!changename', () => {
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
          maker_id: '123',
          maker_name: 'Creator',
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

  it('no name', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!changename',
        channel: 'general',
        discord_id: '128',
      }),
      await TEST.mockMessage(
        'error.missingParameter',
        { type: 'userError' },
      )
    );
  });

  it('Name is the same', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!changename Creator',
        channel: 'general',
        discord_id: '256',
      }),
      'You already have the name "Creator" ',
    );
  });

  it('Name is a special character', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!changename <@456681756700000000>',
        channel: 'general',
        discord_id: '256',
      }),
      "We can't process your command because it had special discord strings like <@666085542085001246> in it ",
    );
  });

  it('Name already used', async () => {
    await TEST.ts.db.Members.query()
      .patch({ is_mod: 1 })
      .where({ discord_id: 128 });
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!changename Mod',
        channel: 'general',
        discord_id: '256',
      }),
      'There is already another member with name "Mod" ',
    );
  });

  it('success', async () => {
    assert.equal(
      await TEST.mockBotSend({
        cmd: '!changename a_new_name',
        channel: 'general',
        discord_id: '256',
      }),
      'You have changed your name from "Creator" to "a_new_name"',
    );
    const member = await TEST.ts.db.Members.query()
      .where({ discord_id: '256' })
      .first();
    assert.equal(member.name, 'a_new_name');
  });
});
