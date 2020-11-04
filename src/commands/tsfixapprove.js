const TSCommand = require('../TSCommand.js');

class TSFixApprove extends TSCommand {
  constructor() {
    super('auditapprove/auditreject', {
      aliases: [
        'tsfixapprove',
        'tsfixreject',
        'fixapprove',
        'fixreject',
        'tsauditapprove',
        'tsauditreject',
        'auditapprove',
        'auditreject',
      ],
      args: [
        {
          id: 'reason',
          description: 'reason | difficulty reason',
          type: 'longtext',
          match: 'rest',
          default: null,
        },
      ],
      quoted: true,
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message, args) {
    const { command } = args;
    let { reason } = args;

    const { code, inAuditDiscussionChannel } = ts.getCodeArgument(
      message,
    );

    let approving = false;

    if (
      command.command === 'tsfixapprove' ||
      command.command === 'fixapprove' ||
      command.command === 'tsauditapprove' ||
      command.command === 'auditapprove'
    ) {
      approving = true;
    }

    const label = message.channel.name
      .toLowerCase()
      .replace(code.toLowerCase(), '');

    if (!inAuditDiscussionChannel) return false; // silently fail

    if (
      ts.discord.messageGetParent(message) !==
      ts.channels.levelAuditCategory
    )
      ts.userError(
        await ts.message('fixApprove.notInChannel', { code }),
      );

    let difficulty = null;
    if (
      label === ts.CHANNEL_LABELS.AUDIT_RERATE_REQUEST &&
      approving
    ) {
      if (reason.indexOf(' ') === -1) {
        difficulty = reason;
        reason = '';
      } else {
        difficulty = reason.substring(0, reason.indexOf(' '));
        reason = reason.substring(reason.indexOf(' ') + 1);
      }
      // We only check difficulty in tsapprove mode
      if (!difficulty || !ts.valid_difficulty(difficulty)) {
        ts.userError('approval.invalidDifficulty');
      }

      if (!reason) {
        ts.userError('error.missingParameter');
      }

      if (reason.length > 800) {
        ts.userError('error.textTooLong', { maximumChars: 800 });
      }

      if (ts.isSpecialDiscordString(reason)) {
        ts.userError('error.specialDiscordString');
      }

      reason = reason.trim();
    }

    if (
      label !== ts.CHANNEL_LABELS.AUDIT_FIX_REQUEST &&
      label !== ts.CHANNEL_LABELS.AUDIT_APPROVED_REUPLOAD &&
      label !== ts.CHANNEL_LABELS.AUDIT_DELETION_REQUEST &&
      label !== ts.CHANNEL_LABELS.AUDIT_RERATE_REQUEST &&
      label !== ts.CHANNEL_LABELS.AUDIT_VERIFY_CLEARS
    ) {
      ts.userError(await ts.message('fixApprove.noLabel'));
    }
    return ts.finishAuditRequest(
      code,
      ts.discord.getAuthor(message),
      reason,
      approving,
      label,
      difficulty,
    );
  }
}
module.exports = TSFixApprove;
