const TSCommand = require('../TSCommand.js');

class points extends TSCommand {
  constructor() {
    super('points', {
      aliases: ['points', 'rank', 'point'],
      args: [
        {
          id: 'role',
          type: 'string',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { role }) {
    const player = await ts.getUser(message);
    if (role === 'role' || role === 'norole') {
      await ts.discord.removeRoles(
        ts.discord.getAuthor(message),
        ts.rank_ids,
      );
    }
    if (role === 'role' && player.rank.discord_role) {
      await ts.discord.addRole(
        ts.discord.getAuthor(message),
        player.rank.discord_role,
      );
    }

    let msg = ts.message('points.points', { player });

    if (player.earned_points.canUpload) {
      msg += ts.message('points.canUpload');
    } else {
      msg += ts.message('points.cantUpload', {
        points_needed: player.earned_points.pointsNeeded,
      });
    }
    msg += ts.message('points.rank', { player });
    await ts.discord.messageSend(message, player.userReply + msg);
  }
}
module.exports = points;
