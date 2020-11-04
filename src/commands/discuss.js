const TSCommand = require('../TSCommand.js');

class TSDiscussChannel extends TSCommand {
  constructor() {
    super('fixdiscuss', {
      aliases: ['discusschannel', 'fixdiscuss', 'discuss'],
      channelRestriction: 'guild',
      args: [
        {
          id: 'level',
          description: 'levelCode',
          type: 'level:pending',
          default: null,
        },
      ],
      quoted: true,
    });
  }

  async tsexec(ts, message, { level }) {
    const { channel } = await ts.pendingDiscussionChannel(level.code);
    const voteEmbed = await ts.makeVoteEmbed(level);
    await ts.discord.updatePinned(channel, voteEmbed);
  }
}
module.exports = TSDiscussChannel;
