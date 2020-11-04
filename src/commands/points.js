const TSCommand = require('../TSCommand.js');

class points extends TSCommand {
  constructor() {
    super('rank', {
      aliases: ['points', 'rank', 'point'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const player = await ts.getUser(message);

    let msg = await ts.message('points.points', { player });

    if (player.earned_points.canUpload) {
      msg += await ts.message('points.canUpload');
    } else {
      msg += await ts.message('points.cantUpload', {
        points_needed: player.earned_points.pointsNeeded,
      });
    }
    msg += await ts.message('points.rank', { player });
    await ts.discord.messageSend(message, player.userReply + msg);
  }
}
module.exports = points;
