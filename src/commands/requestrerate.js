const TSCommand = require('../TSCommand.js');
// const DiscordLog = require('../DiscordLog');

class RequestRerate extends TSCommand {
  constructor() {
    super('tsrequestrerate', {
      aliases: ['tsrequestrerate', 'requestrerate'],
      channelRestriction: 'guild',
      args: [
        {
          id: 'level',
          type: 'level:approved',
          default: null,
        },
        {
          id: 'reasonAndDifficulty',
          type: 'longtext',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
    });
  }

  async tsexec(ts, message, { level, reasonAndDifficulty }) {
    const player = await ts.getUser(message);

    await ts.auditDiscussionChannel(
      level.code,
      null,
      ts.CHANNEL_LABELS.AUDIT_RERATE_REQUEST,
      {
        requester: ts.discord.getAuthor(message),
      },
    );

    const voteEmbed = await ts.makeVoteEmbed(level);
    await ts.discord.updatePinned(
      `${ts.CHANNEL_LABELS.AUDIT_RERATE_REQUEST}${level.code}`,
      voteEmbed,
    );

    await ts.discord.send(
      `${ts.CHANNEL_LABELS.AUDIT_RERATE_REQUEST}${level.code}`,
      `Rerate request by <@${player.discord_id}> with message: \`\`\`${reasonAndDifficulty}\`\`\``,
    );

    return ts.discord.reply(
      message,
      "Your rerate request was received, we'll get back to you in a bit!",
    );
  }
}
module.exports = RequestRerate;
