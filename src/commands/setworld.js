const TSCommand = require('../TSCommand.js');

class SetWorld extends TSCommand {
  constructor() {
    super('setworld', {
      aliases: ['setworld'],
      args: [
        {
          id: 'world_count',
          type: 'string',
          default: null,
        },
        {
          id: 'level_count',
          type: 'string',
          default: null,
        },
        {
          id: 'world_name',
          type: 'string',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const command = ts.parseCommand(message);

    const worldCount = parseInt(command.arguments.shift(), 10);
    const levelCount = parseInt(command.arguments.shift(), 10);
    const worldName = command.arguments.join(' ');

    if (!worldCount)
      ts.userError(ts.message('setworld.invalidWorldCount'));
    if (!levelCount)
      ts.userError(ts.message('setworld.invalidLevelCount'));
    if (!worldName) ts.userError(ts.message('setworld.noWorldName'));

    const player = await ts.getUser(message);

    if (!player.maker_id || !player.maker_name) {
      ts.userError(ts.message('setworld.noMakerId'));
    }

    await ts.db.Members.query()
      .patch({
        world_world_count: worldCount,
        world_level_count: levelCount,
        world_description: worldName,
      })
      .where({ discord_id: message.author.id });

    message.channel.send(
      player.userReply + ts.message('setworld.success'),
    );
  }
}
module.exports = SetWorld;
