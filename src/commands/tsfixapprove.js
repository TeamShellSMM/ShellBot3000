const TSCommand = require('../TSCommand.js');

class TSFixApprove extends TSCommand {
  constructor() {
    super('tsfixapprove', {
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
      split: 'quoted',
      args: [
        {
          id: 'reason',
          type: 'string',
          default: null,
        },
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    /*
        Possible command syntax:
        !tsapprove code difficulty reason
        !tsreject code reason

        in channel
        !tsapprove difficulty reason
        !tsreject reason
      */

    const {
      code,
      command,
      inAuditDiscussionChannel,
    } = ts.getCodeArgument(message);

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
      difficulty = command.next();
      // We only check difficulty in tsapprove mode
      if (!difficulty || !ts.valid_difficulty(difficulty)) {
        ts.userError('approval.invalidDifficulty');
      }
    }

    const reason = command.rest();

    if (!reason)
      ts.userError(await ts.message('fixApprove.noReason'));
    ts.reasonLengthCheck(reason, 800);

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
