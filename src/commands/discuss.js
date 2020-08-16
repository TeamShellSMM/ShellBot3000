const TSCommand = require('../TSCommand.js');

class TSDiscussChannel extends TSCommand {
  constructor() {
    super('discusschannel', {
      aliases: ['discusschannel', 'fixdiscuss', 'discuss'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const { code } = ts.getCodeArgument(message);

    const level = await ts.getLevels().where({ code }).first();

    if (!level) {
      ts.discord.removeChannel(code);
      ts.userError(await ts.message('error.levelNotFound', { code }));
    }

    if (level.status !== ts.LEVEL_STATUS.PENDING) {
      ts.userError(await ts.message('approval.levelNotPending'));
    }

    const { channel } = await ts.pendingDiscussionChannel(level.code);
    const voteEmbed = await ts.makeVoteEmbed(level);
    await ts.discord.updatePinned(channel, voteEmbed);
  }
}
module.exports = TSDiscussChannel;
