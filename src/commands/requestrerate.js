const TSCommand = require('../TSCommand.js');

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
      ts.userError(ts.message('error.noCode'));
    } else {
      code = code.toUpperCase();
    }

    const reason = command.arguments.join(' ');

    if (!reason) {
      ts.userError(
        ts.userError(ts.message('requestRerate.noReason')),
      );
    }
    ts.reasonLengthCheck(reason, 800);

    const player = await ts.getUser(message);
    const level = await ts.getExistingLevel(code, true);

    await ts.auditDiscussionChannel(
      code,
      null,
      ts.CHANNEL_LABELS.AUDIT_RERATE_REQUEST,
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
