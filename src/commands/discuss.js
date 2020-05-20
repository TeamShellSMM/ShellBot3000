const TSCommand = require('../TSCommand.js');

class TSDiscussChannel extends TSCommand {
  constructor() {
    super('discusschannel', {
      aliases: ['discusschannel', 'fixdiscuss'],
      split: 'quoted',
      args: [
        {
          id: 'code',
          type: 'uppercase',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async canRun(ts, message) {
    return ts.modOnly(ts.discord.getAuthor(message));
  }

  async tsexec(ts, message, args) {
    let { code } = args;
    // Check if in level discussion channel
    if (ts.valid_code(message.channel.name.toUpperCase())) {
      code = message.channel.name.toUpperCase();
    }

    if (code) {
      code = code.toUpperCase();
    } else {
      ts.userError(ts.message('error.noCode'));
    }

    const level = await ts.getLevels().where({ code }).first();

    if (!level) {
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
