const debugApiTests = require('debug')('shellbot3000:api');

describe('channel cache tests', function () {
  beforeEach(async () => {
    await TEST.clearChannels();
  });

  it('create channel overload', async function () {
    // Update this to higher to actually test it
    for (let i = 0; i < 1; i += 1) {
      debugApiTests('create channel overload pass C', i + 1);
      await global.TEST.ts.discord.createChannel('🔨XXX-XXX-XX6', {
        type: 'text',
        parent: TEST.ts.channels.levelAuditCategory,
      });
      assert.exists(
        TEST.findChannel({
          name: '🔨XXX-XXX-XX6',
          parent: TEST.ts.channels.levelAuditCategory,
        }),
      );
      debugApiTests('create channel overload pass D', i + 1);
      await global.TEST.ts.discord.removeChannel('🔨XXX-XXX-XX6', {
        type: 'text',
        reason: 'yeah',
      });
      assert.notExists(
        TEST.findChannel({
          name: '🔨XXX-XXX-XX6',
          parent: TEST.ts.channels.levelAuditCategory,
        }),
      );
    }
  });

  // This is the only way to actually test this, i guess it releases the connection?
  // for (let j = 0; j < 50; j += 1) {
  it('rename channel overload', async function () {
    const oldCode = '🔨XXX-XXX-000';

    await global.TEST.ts.discord.createChannel(oldCode, {
      type: 'text',
      parent: TEST.ts.channels.levelAuditCategory,
    });
    assert.exists(
      TEST.findChannel({
        name: oldCode,
        parent: TEST.ts.channels.levelAuditCategory,
      }),
    );

    const code = `🔨XXX-XXX-XX1`;

    debugApiTests('rename channel overload pass', oldCode, code);

    await global.TEST.ts.discord.renameChannel(oldCode, code);

    debugApiTests('done renaming');

    assert.exists(
      TEST.findChannel({
        name: code,
        parent: TEST.ts.channels.levelAuditCategory,
      }),
    );

    debugApiTests('done with the assert');
  });
  // }
});
