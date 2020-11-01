const TSCommand = require('../TSCommand.js');

class TSRefuseFix extends TSCommand {
  constructor() {
    super('tsrefusefix', {
      aliases: ['tsrefusefix', 'refusefix'],
      args: [
        {
          id: 'level',
          type: 'level',
          default: null,
        },
        {
          id: 'reason',
          type: 'text',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, {command, level, reason}) {
    const player = await ts.getUser(message);
    const author = await ts.db.Members.query()
      .where({ name: level.creator })
      .first();

    if (level.status === ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD)
      ts.userError('You already sent this reupload request back!');

    if (level.status !== ts.LEVEL_STATUS.NEED_FIX)
      ts.userError('This level is not currently in a fix request!');

    // only creator can use this command
    if (!(level.creator === player.name))
      ts.userError(
        'You can only use this command on one of your own levels that currently has an open fix request.',
      );

    await ts.db.Levels.query()
      .where({ code: level.code })
      .patch({ status: ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD });
    level.status = ts.LEVEL_STATUS.PENDING_NOT_FIXED_REUPLOAD;

    await ts.auditDiscussionChannel(
      level.code,
      null,
      ts.CHANNEL_LABELS.AUDIT_FIX_REQUEST,
      {
        requester: ts.discord.getAuthor(message),
      },
    );

    await ts.discord.send(
      `${ts.CHANNEL_LABELS.AUDIT_FIX_REQUEST}${level.code}`,
      `Reupload Request for <@${author.discord_id}>'s level got refused with message: \`\`\`${reason}\`\`\``,
    );

    await ts.fixModPing(level.code);

    const voteEmbed = await ts.makeVoteEmbed(level, reason);
    await ts.discord.updatePinned(level.code, voteEmbed);

    return ts.discord.reply(
      message,
      "Your level was put in the reupload queue, we'll get back to you in a bit!",
    );
  }
}
module.exports = TSRefuseFix;
