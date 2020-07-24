const TSCommand = require('../TSCommand.js');

class tsremove extends TSCommand {
  constructor() {
    super('tsremove', {
      aliases: [
        'tsremove',
        'tsremovelevel',
        'remove',
        'removelevel',
        'requestremoval',
        'tsrequestremoval',
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { command }) {
    let code = command.arguments.shift();
    if (!code) {
      ts.userError(ts.message('error.noCode'));
    } else {
      code = code.toUpperCase();
    }

    const reason = command.arguments.join(' ');

    if (!reason) {
      ts.userError(ts.userError(ts.message('removeLevel.noReason')));
    }
    ts.reasonLengthCheck(reason, 800);

    const player = await ts.getUser(message);
    const level = await ts.getExistingLevel(code, true);

    if (ts.REMOVED_LEVELS.includes(level.status)) {
      ts.userError(ts.message('removeLevel.alreadyRemoved', level));
    }

    await ts.auditDiscussionChannel(
      code,
      null,
      ts.CHANNEL_LABELS.AUDIT_DELETION_REQUEST,
      {
        requester: ts.discord.getAuthor(message),
      },
    );

    const voteEmbed = await ts.makeVoteEmbed(level);
    await ts.discord.updatePinned(
      `${ts.CHANNEL_LABELS.AUDIT_DELETION_REQUEST}${code}`,
      voteEmbed,
    );

    await ts.discord.send(
      `${ts.CHANNEL_LABELS.AUDIT_DELETION_REQUEST}${code}`,
      `Deletion request by <@${player.discord_id}>' with message: \`\`\`${reason}\`\`\``,
    );

    return ts.discord.reply(
      message,
      "Your deletion request was received, we'll get back to you in a bit!",
    );
  }
}
module.exports = tsremove;
