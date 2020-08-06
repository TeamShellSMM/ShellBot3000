const TSCommand = require('../TSCommand.js');

class removevote extends TSCommand {
  constructor() {
    super('removevote', {
      aliases: ['removevote', 'tsremovevote'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    if (
      !(
        ts.discord.messageGetChannel(message) ===
          ts.channels.modChannel || // only in shellder-bot channel
        ts.discord.messageGetChannel(message) ===
          ts.channels.pendingShellbot || // or in pending-shellbot channel
        ts.discord.messageGetParent(message) ===
          ts.channels.levelDiscussionCategory || // should also work in the discussion channel for that level
        ts.discord.messageGetParent(message) ===
          ts.channels.levelAuditCategory
      )
    )
      return false; // silently fail

    const { code } = ts.getCodeArgument(message);
    const player = await ts.getUser(message);
    const level = await ts.getExistingLevel(code);

    if (level.status !== ts.LEVEL_STATUS.PENDING) {
      ts.userError(await ts.message('approval.levelNotPending'));
    }

    const vote = await ts
      .getPendingVotes()
      .where('members.id', player.id)
      .where('levels.id', level.id)
      .whereIn('type', ['approve', 'fix', 'reject'])
      .first();

    if (!vote) ts.userError('vote.noVoteSubmitted', level);

    await ts.knex('pending_votes').where({ id: vote.id }).del();

    const { channel } = await ts.pendingDiscussionChannel(level.code);
    const voteEmbed = await ts.makeVoteEmbed(level);
    await ts.discord.updatePinned(channel, voteEmbed);

    return ts.discord.messageSend(
      message,
      await ts.message('vote.voteRemoved', level),
    );
  }
}
module.exports = removevote;
