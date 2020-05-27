const DiscordWrapper = require('../../src/DiscordWrapper');

describe('DiscordWrapper', function () {
  afterEach(async () => {
    sinon.restore();
  });

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

  it('removeChannel not exist', async () => {
    assert.isFalse(
      await TEST.ts.discord.removeChannel('channel-not-exist'),
    );
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

  it('channelSize', async () => {
    const channel = sinon.stub(TEST.ts.discord, 'channel');
    channel.returns({
      children: {
        size: 2,
      },
    });
    assert.equal(TEST.ts.discord.channelSize('category'), 2);
    sinon.assert.calledOnce(channel);
    channel.restore();
  });

  it('checkChannelFull', async () => {
    const channel = sinon.stub(TEST.ts.discord, 'channel');
    channel.returns({
      children: {
        size: 50,
      },
    });
    assert.throws(
      () => TEST.ts.discord.checkChannelFull('category'),
      Error,
      'channel full',
    );
    channel.restore();
  });

  it('create existing channel', async () => {
    const channel = sinon.stub(TEST.ts.discord, 'channel');
    channel.returns(true);
    const setChannelParent = sinon.stub(
      TEST.ts.discord,
      'setChannelParent',
    );
    setChannelParent.returns('channel parent set');
    assert.equal(
      await TEST.ts.discord.createChannel('channel-name'),
      'channel parent set',
    );
    sinon.assert.calledOnce(setChannelParent);
    channel.restore();
    setChannelParent.restore();
  });

  it('test send methods', async () => {
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

  it('empty calls returns null', async () => {
    assert.isNull(TEST.ts.discord.getContent());
    assert.isNull(TEST.ts.discord.messageGetChannel());
    assert.isNull(
      TEST.ts.discord.messageGetChannel({ name: 'test' }),
    );
    assert.isNull(TEST.ts.discord.messageGetChannelName());
    assert.isNull(
      TEST.ts.discord.messageGetChannelName({ name: 'test' }),
    );
    assert.isNull(TEST.ts.discord.messageGetParent());
    assert.isNull(TEST.ts.discord.messageGetParent({ name: 'test' }));

    assert.isNull(TEST.ts.discord.getUsername());
    assert.isNull(TEST.ts.discord.getUsername({ name: 'test' }));
  });

  it('add/removeRoles, getMembersWithRole', async () => {
    const botId = TEST.ts.discord.botId();
    const guild = TEST.ts.discord.guild();
    let role1 = guild.roles.find((r) => r.name === 'role1-test');
    if (!role1) {
      role1 = await guild.createRole({
        name: 'role1-test',
        hoist: true,
        color: 'BLUE',
      });
    }
    let role2 = guild.roles.find((r) => r.name === 'role2-test');
    if (!role2) {
      role2 = await guild.createRole({
        name: 'role2-test',
        hoist: true,
        color: 'RED',
      });
    }
    await TEST.ts.discord.removeRoles(botId, [role1.id, role2.id]);
    await TEST.ts.discord.addRole(botId, role1.id);
    assert.exists(
      TEST.ts.discord
        .member(botId)
        .roles.find((r) => r.name === 'role1-test'),
    );
    const memberWithRoles = TEST.ts.discord.getMembersWithRole(
      'role1-test',
    );
    assert.lengthOf(memberWithRoles, 1);
    assert.equal(memberWithRoles[0], botId);
    await TEST.ts.discord.removeRoles(botId, [role1.id, role2.id]);

    await guild.fetchMembers();
    // TODO: this sometimes fail and returns something, and we're not sure why. Rerunning the tests usually pass it though
    assert.notExists(
      TEST.ts.discord
        .member(botId)
        .roles.find((r) => r.name === 'role1-test'),
    );
  });

  it('dm', async () => {
    const send = sinon.fake();
    const member = sinon.stub(TEST.ts.discord, 'member');
    member.returns({
      send,
    });

    await TEST.ts.discord.dm('discord_id', 'message to send');

    sinon.assert.calledOnce(member);
    sinon.assert.calledWith(member, 'discord_id');

    sinon.assert.calledOnce(send);
    sinon.assert.calledWith(send, 'message to send');

    sinon.restore();
  });

  // takes 20seconds+ to run
  it('updatePinned @slow', async () => {
    await TEST.ts.discord.createChannel('update-pin-test');

    await TEST.ts.discord.updatePinned(
      'update-pin-test',
      'this is pinned',
    );

    const channel = TEST.ts.discord.channel('update-pin-test');
    const pinned = await channel.fetchPinnedMessages(false);
    assert.lengthOf(pinned.array(), 1);
    assert.equal(pinned.last().content, 'this is pinned');

    await TEST.ts.discord.updatePinned(
      'update-pin-test',
      'update pinned',
    );

    const pinned2 = await channel.fetchPinnedMessages(false);
    assert.lengthOf(pinned2.array(), 1);
    assert.equal(pinned2.last().content, 'update pinned');
  }).timeout(0);
});
