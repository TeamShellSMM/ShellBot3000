const TSCommand = require('../TSCommand.js');
// const DiscordLog = require('../DiscordLog');

class RequestRerate extends TSCommand {
  constructor() {
    super('tsrequestrerate', {
      aliases: ['tsrequestrerate', 'requestrerate'],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, { command }) {
    let code = command.arguments.shift();
    if (!code) {
      ts.userError(await ts.message('error.noCode'));
    } else {
      code = code.toUpperCase();
    }

    const reason = command.arguments.join(' ');

    if (!reason) {
      ts.userError(await ts.message('requestRerate.noReason'));
    }
    ts.reasonLengthCheck(reason, 800);

    const player = await ts.getUser(message);
    const level = await ts.getExistingLevel(code, true);

    if (level.status !== ts.LEVEL_STATUS.APPROVED) {
      ts.userError(await ts.message('requestRerate.notApproved'));
    }

    await ts.auditDiscussionChannel(
      code,
      null,
      ts.CHANNEL_LABELS.AUDIT_RERATE_REQUEST,
      {
        requester: ts.discord.getAuthor(message),
      },
    );

    const voteEmbed = await ts.makeVoteEmbed(level);
    await ts.discord.updatePinned(
      `${ts.CHANNEL_LABELS.AUDIT_RERATE_REQUEST}${code}`,
      voteEmbed,
    );

    await ts.discord.send(
      `${ts.CHANNEL_LABELS.AUDIT_RERATE_REQUEST}${code}`,
      `Rerate request by <@${player.discord_id}> with message: \`\`\`${reason}\`\`\``,
    );

    return ts.discord.reply(
      message,
      "Your rerate request was received, we'll get back to you in a bit!",
    );
  }
}
module.exports = RequestRerate;
