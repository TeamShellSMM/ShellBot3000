const DiscordWrapper = require('../../src/DiscordWrapper');

describe('DiscordWrapper', function () {
  it('setClient no client', async () => {
    assert.throws(
      () => DiscordWrapper.setClient(),
      Error,
      'No client passed to DiscordWrapper()',
    );
  });

  it('channel() no arguments', async () => {
    assert.throws(
      () => TEST.ts.discord.channel(),
      Error,
      'Empty channel name or id is passed to discordwrapper.channel',
    );
  });

  it('channelSize() no arguments', async () => {
    assert.throws(
      () => TEST.ts.discord.channelSize(),
      Error,
      'Empty channel name or id is passed to discordwrapper.channelSize',
    );
  });

  it('channelSize() no channel found', async () => {
    assert.throws(
      () => TEST.ts.discord.channelSize('123'),
      Error,
      'Cannot find the channel category in channelSize()',
    );
  });

  it('rename channel, not found', async () => {
    assert.isFalse(
      await TEST.ts.discord.renameChannel(
        'no-channel',
        'no-channel2',
      ),
    );
  });

  it('removeChannel', async () => {
    const name = 'name';
    await TEST.createChannel({ name });
    await TEST.ts.discord.removeChannel(name);
    assert.notExists(TEST.findChannel({ name }));
  });

  it('rename', async () => {
    const oldName = 'oldName';
    const newName = 'newName';
    await TEST.createChannel({ name: oldName });
    await TEST.ts.discord.renameChannel(oldName, newName);
    assert.notExists(TEST.findChannel({ name: oldName }));
    assert.exists(TEST.findChannel({ name: newName }));

    await TEST.ts.discord.removeChannel(newName);
  });

  it('send general', async () => {
    const message = await TEST.ts.discord.send(
      'general',
      'discord.send',
    );
    assert.exists(message);
    const general = TEST.ts.discord.channel('general');
    assert.exists(
      await DiscordWrapper.send(general.id, 'discord.send'),
    );
    await TEST.ts.discord.reply(message, 'discord.reply');
    await DiscordWrapper.reply(message, 'DiscordWrapper.reply');
    await TEST.ts.discord.messageSend(message, 'discord.messageSend');
  });
});
