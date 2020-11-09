describe('collabs', function () {
  before(async () => {
    await TEST.clearChannels();
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
          name: 'Collaborator1',
          discord_id: '512',
        },
        {
          name: 'Collaborator2',
          discord_id: '513',
        },
        {
          name: 'Random Dude',
          discord_id: '1024',
        },
      ],
      Levels: [
        {
          level_name: 'level1',
          creator: 2,
          code: 'XXX-XXX-XXX',
          status: 1,
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
        {
          level_name: 'level4',
          creator: 2,
          code: 'XXX-XXX-XX4',
          status: 1,
          difficulty: 2.5,
        },
      ],
    });
  });

  it('!addcollaborators creator success', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!addcollaborators XXX-XXX-XXX Collaborator1',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });

    assert.equal(
      result,
      `<@256> ${await TEST.ts.message(
        'addcollaborators.success',
      )}\n${await TEST.ts.message('collaborators.list', {
        levelName: 'level1',
        levelCode: 'XXX-XXX-XXX',
        collaborators: 'Collaborator1',
      })}`,
    );
  });

  it('!addcollaborators mod success', async function () {
    const modOnly = sinon.stub(TEST.ts, 'modOnly');
    modOnly.returns(true);
    const result = await TEST.mockBotSend({
      cmd: '!addcollaborators XXX-XXX-XXX Collaborator2',
      channel: TEST.ts.channels.modChannel,
      discord_id: '128',
    });
    modOnly.restore();

    assert.equal(
      result,
      `<@128> ${await TEST.ts.message(
        'addcollaborators.success',
      )}\n${await TEST.ts.message('collaborators.list', {
        levelName: 'level1',
        levelCode: 'XXX-XXX-XXX',
        collaborators: 'Collaborator1\nCollaborator2',
      })}`,
    );
  });

  it('!addcollaborators not allowed', async function () {
    const modOnly = sinon.stub(TEST.ts, 'modOnly');
    modOnly.returns(false);
    const result = await TEST.mockBotSend({
      cmd: '!addcollaborators XXX-XXX-XXX Random Dude',
      channel: TEST.ts.channels.modChannel,
      discord_id: '1024',
    });

    assert.equal(
      result,
      `${await TEST.ts.message('collaborators.notAllowed')} `,
    );
  });

  it('!addcollaborators member not found', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!addcollaborators XXX-XXX-XXX Collaborator3',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });

    assert.equal(
      result,
      '>>> **!addcollaborators <levelCode> __<Member1,Member2,Member3,...>__**\n<@256>, No member with the name "Collaborator3" was found in the members list. ',
    );
  });

  it('!addcollaborators nothing changed', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!addcollaborators XXX-XXX-XXX Collaborator1',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });

    assert.equal(
      result,
      `<@256> ${await TEST.ts.message(
        'collaborators.noChange',
      )}\n${await TEST.ts.message('collaborators.list', {
        levelName: 'level1',
        levelCode: 'XXX-XXX-XXX',
        collaborators: 'Collaborator1\nCollaborator2',
      })}`,
    );
  });

  it('!addcollaborators invalid level code', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!addcollaborators XXX-XXX-XX8 Collaborator1',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });

    assert.equal(
      result,
      'The code `XXX-XXX-XX8` was not found in AutoTest\'s list. Did you mean:```\nXXX-XXX-XXX - "level1" by Creator``` ',
    );
  });

  it('!removecollaborator creator success', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!removecollaborators XXX-XXX-XXX Collaborator1',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });

    assert.equal(
      result,
      `<@256> ${await TEST.ts.message(
        'removecollaborators.success',
      )}\n${await TEST.ts.message('collaborators.list', {
        levelName: 'level1',
        levelCode: 'XXX-XXX-XXX',
        collaborators: 'Collaborator2',
      })}`,
    );
  });

  it('!removecollaborator mod success', async function () {
    const result = await TEST.mockBotSend({
      cmd: '!removecollaborators XXX-XXX-XXX Collaborator2',
      channel: TEST.ts.channels.modChannel,
      discord_id: '256',
    });

    assert.equal(
      result,
      `<@256> ${await TEST.ts.message(
        'removecollaborators.success',
      )}\n${await TEST.ts.message('collaborators.list', {
        levelName: 'level1',
        levelCode: 'XXX-XXX-XXX',
        collaborators: '-',
      })}`,
    );
  });
});
