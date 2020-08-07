const validUrl = require('valid-url');
const TSCommand = require('../TSCommand.js');

class TSAddvids extends TSCommand {
  constructor() {
    super('tsaddvids', {
      aliases: [
        'tsaddvids',
        'addvids',
        'tsaddvid',
        'addvid',
        'tsremovevids',
        'removevids',
        'tsrmemovevid',
        'removevid',
      ],
      channelRestriction: 'guild',
    });
  }

  async tsexec(ts, message) {
    const addCommands = [
      'tsaddvids',
      'addvids',
      'tsaddvid',
      'addvid',
    ];

    const command = ts.parseCommand(message);
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
    const filteredUrl = [];
    const notUrls = [];
    newVids.forEach((url) => {
      if (url) {
        if (validUrl.isWebUri(url)) {
          filteredUrl.push(url);
        } else {
          notUrls.push(url);
        }
      }
    });
    if (notUrls.length)
      ts.userError(
        `The links below didn't look like urls: \`\`\`\n${notUrls.join(
          '\n',
        )}\`\`\``,
      );

    const player = await ts.getUser(message);
    const level = await ts.getExistingLevel(code);
    let reply;
    let oldVids = level.videos ? level.videos.split(',') : [];

    if (addCommands.indexOf(command.command) !== -1) {
      // adding
      newVids = [];
      filteredUrl.forEach((url) => {
        if (oldVids.indexOf(url) === -1) {
          newVids.push(url);
        }
      });
      if (newVids.length === 0) {
        ts.userError(
          `No new clear video added for "${level.level_name}" by ${
            level.creator
          }${await ts.message('addVids.currentVideos', {
            videos_str: oldVids.join('\n'),
          })}`,
        );
      }
      oldVids = oldVids.concat(newVids);
      reply =
        (await ts.message('addVids.haveNew', level)) +
        (await ts.message('addVids.currentVideos', {
          videos_str: oldVids.join('\n'),
        }));
    } else {
      // removing
      if (!(level.creator === player.name || player.is_mod === 1)) {
        ts.userError('addVids.noPermission', level);
      }

      newVids = [];
      oldVids.forEach((url) => {
        if (filteredUrl.indexOf(url) === -1) {
          newVids.push(url);
        }
      });
      if (oldVids.length === newVids.length) {
        ts.userError(
          (await ts.message('addVids.noRemoved', level)) +
            (await ts.message('addVids.currentVideos', {
              videos_str: oldVids.join('\n'),
            })),
        );
      }
      oldVids = newVids;
      reply =
        (await ts.message('addVids.haveRemoved', level)) +
        (await ts.message('addVids.currentVideos', {
          videos_str: oldVids.join('\n'),
        }));
    }

    await ts.db.Levels.query()
      .patch({ videos: oldVids.join(',') })
      .where({ code });

    await ts.discord.messageSend(message, player.userReply + reply);
  }
}
module.exports = TSAddvids;
