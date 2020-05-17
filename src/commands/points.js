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
    const player = await ts.get_user(message);

    if (role == 'role' || role == 'norole') {
      await message.member.removeRoles(ts.rank_ids);
    }
    if (role == 'role' && player.rank.discord_role) {
      await message.member.addRole(player.rank.discord_role);
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
    await message.channel.send(player.user_reply + msg);
  }
}
module.exports = points;
