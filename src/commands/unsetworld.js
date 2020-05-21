const TSCommand = require('../TSCommand.js');

class UnsetWorld extends TSCommand {
  constructor() {
    super('unset', {
      aliases: ['unset', 'unsetworld'],
      args: [],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const player = await ts.getUser(message);

    await ts.db.Members.query()
      .patch({
        world_world_count: 0,
        world_level_count: 0,
        world_description: '',
      })
      .where({ discord_id: ts.discord.getAuthor(message) });

    ts.discord.messageSend(
      message,
      player.userReply + ts.message('unsetworld.success'),
    );
  }
}
module.exports = UnsetWorld;
