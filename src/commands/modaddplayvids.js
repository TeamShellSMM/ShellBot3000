const TSCommand = require('../TSCommand.js');

class ModAddPlayVids extends TSCommand {
  constructor() {
    super('modaddplayvids', {
      aliases: [
        'modaddplayvids',
        'modaddplayvid',
        'modremoveplayvids',
        'modremoveplayvid',
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const command = ts.parseCommand(message);
    const memberName = command.arguments.shift();

    if (!memberName) {
      ts.userError(await ts.message('modaddlevel.missingMemberName'));
    }

    const member = await ts.db.Members.query()
      .whereRaw('lower(name) = ?', [memberName.toLowerCase()])
      .first();

    if (!member) {
      ts.userError(
        await ts.message('modaddlevel.memberNotFound', {
          name: memberName,
        }),
      );
    }

    let code = command.arguments.shift();
    if (code) {
      code = code.toUpperCase();
    } else {
      ts.userError('error.noCode');
    }

    let newVids = command.arguments.join(' ');
    if (!newVids) {
      ts.userError("You didn't give any links");
    }
    newVids = newVids.split(/[, \n]/);

    const submitter = await ts.getUser(message);

    const reply = await ts.addVideos({
      command,
      code,
      newVids,
      player: member,
      submitter,
    });

    await ts.discord.messageSend(message, reply);
  }
}
module.exports = ModAddPlayVids;
