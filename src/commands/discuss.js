const TSCommand = require('../TSCommand.js');

class TSDiscussChannel extends TSCommand {
  constructor() {
    super('discusschannel', {
      aliases: ['discusschannel', 'fixdiscuss', 'discuss'],
      channelRestriction: 'guild',
    });
  }

  async canRun(ts, message) {
    return ts.modOnly(ts.discord.getAuthor(message));
  }

  async tsexec(ts, message) {
    const { code } = ts.getCodeArgument(message);

    const level = await ts.getLevels().where({ code }).first();

    if (!level) {
      ts.discord.removeChannel(code);
      ts.userError(ts.message('error.levelNotFound', { code }));
    }

    const { channel } = await ts.discussionChannel(
      level.code,
      level.status === ts.LEVEL_STATUS.PENDING
        ? ts.channels.levelDiscussionCategory
        : ts.channels.pendingReuploadCategory,
    );
    const voteEmbed = await ts.makeVoteEmbed(level);
    await ts.discord.updatePinned(channel, voteEmbed);
  }
}
module.exports = TSDiscussChannel;
