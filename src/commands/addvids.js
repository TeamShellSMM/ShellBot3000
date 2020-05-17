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

    const command = ts.parse_command(message);
    let code = command.arguments.shift();
    if (code) {
      code = code.toUpperCase();
    } else {
      ts.userError('error.noCode');
    }

    let new_vids = command.arguments.join(' ');
    if (!new_vids) {
      ts.userError("You didn't give any links");
    }
    new_vids = new_vids.split(/[, \n]/);
    const filteredUrl = [];
    const not_urls = [];
    new_vids.forEach((url) => {
      if (url) {
        if (validUrl.isWebUri(url)) {
          filteredUrl.push(url);
        } else {
          not_urls.push(url);
        }
      }
    });
    if (not_urls.length)
      ts.userError(
        `The links below didn't look like urls: \`\`\`\n${not_urls.join(
          '\n',
        )}\`\`\``,
      );

    const player = await ts.get_user(message);
    const level = await ts.getExistingLevel(code);

    let old_vids = level.videos ? level.videos.split(',') : [];

    if (addCommands.indexOf(command.command) != -1) {
      // adding
      new_vids = [];
      filteredUrl.forEach((url) => {
        if (old_vids.indexOf(url) == -1) {
          new_vids.push(url);
        }
      });
      if (new_vids.length == 0) {
        ts.userError(
          `No new clear video added for "${level.level_name}" by ${
            level.creator
          }${ts.message('addVids.currentVideos', {
            videos_str: old_vids.join('\n'),
          })}`,
        );
      }
      old_vids = old_vids.concat(new_vids);
      var reply =
        ts.message('addVids.haveNew', level) +
        ts.message('addVids.currentVideos', {
          videos_str: old_vids.join('\n'),
        });
    } else {
      // removing
      if (!(level.creator == player.name || player.is_mod == '1')) {
        ts.userError('addVids.noPermission', level);
      }

      new_vids = [];
      old_vids.forEach((url) => {
        if (filteredUrl.indexOf(url) == -1) {
          new_vids.push(url);
        }
      });
      if (old_vids.length === new_vids.length) {
        ts.userError(
          ts.message('addVids.noRemoved', level) +
            ts.message('addVids.currentVideos', {
              videos_str: old_vids.join('\n'),
            }),
        );
      }
      old_vids = new_vids;
      var reply =
        ts.message('addVids.haveRemoved', level) +
        ts.message('addVids.currentVideos', {
          videos_str: old_vids.join('\n'),
        });
    }

    await ts.db.Levels.query()
      .patch({ videos: old_vids.join(',') })
      .where({ code });

    await message.channel.send(player.user_reply + reply);
  }
}
module.exports = TSAddvids;
