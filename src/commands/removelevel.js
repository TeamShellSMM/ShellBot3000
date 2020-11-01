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
      args: [
        {
          id: 'level',
          type: 'level',
          default: null,
        },
        {
          id: 'reason',
          type: 'longtext',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { level, reason }) {
    const player = await ts.getUser(message);

    await ts.auditDiscussionChannel(
      level.code,
      null,
      ts.CHANNEL_LABELS.AUDIT_DELETION_REQUEST,
      {
        requester: ts.discord.getAuthor(message),
      },
    );

    const voteEmbed = await ts.makeVoteEmbed(level);
    await ts.discord.updatePinned(
      `${ts.CHANNEL_LABELS.AUDIT_DELETION_REQUEST}${level.code}`,
      voteEmbed,
    );

    await ts.discord.send(
      `${ts.CHANNEL_LABELS.AUDIT_DELETION_REQUEST}${level.code}`,
      `Deletion request by <@${player.discord_id}>' with message: \`\`\`${reason}\`\`\``,
    );

    return ts.discord.reply(
      message,
      "Your deletion request was received, we'll get back to you in a bit!",
    );
  }
}
module.exports = tsremove;
