describe('ts.modOnly', function () {
  before(async () => {
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
      ],
    });
  });

  beforeEach(async () => {
    delete TEST.ts.teamVariables.discordAdminCanMod;
  });

  it('no discord_id == false', async function () {
    assert.isFalse(await TEST.ts.modOnly());
  });
  it('not mod == false', async function () {
    assert.isFalse(await TEST.ts.modOnly('256'));
  });
  it('mod == true', async function () {
    assert.isTrue(await TEST.ts.modOnly('128'));
  });
  it('owner == true', async function () {
    assert.isTrue(
      await TEST.ts.modOnly(TEST.ts.discord.guild().owner.user.id),
    );
  });
  it('discord admin with no "discordAdminCanMod" flag == false', async function () {
    // we use bot for now as bot was set to have admin rights in test server
    // TODO: make admin test users
    assert.isFalse(await TEST.ts.modOnly(TEST.bot_id));
  });
  it('discord admin with  "discordAdminCanMod" flag == true', async function () {
    // we use bot for now as bot was set to have admin rights in test server
    // TODO: make admin test users
    TEST.ts.teamVariables.discordAdminCanMod = 'true';
    assert.isTrue(await TEST.ts.modOnly(TEST.bot_id));
  });
});
