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
        'addmyvids',
        'addmyvid',
        'removemyvids',
        'removemyvid',
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
      'addmyvids',
      'addmyvid',
    ];

    const playCommands = [
      'addmyvids',
      'addmyvid',
      'removemyvids',
      'removemyvid',
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
    const notAllowedUrls = [];
    newVids.forEach((url) => {
      if (url) {
        if (validUrl.isWebUri(url)) {
          const videoType = ts.getVideoType(url);
          if (videoType) {
            filteredUrl.push({
              url: url,
              type: videoType,
            });
          } else {
            notAllowedUrls.push(url);
          }
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

    if (notAllowedUrls.length)
      ts.userError(
        `${await ts.message('addVids.notAllowed', {
          videos: notAllowedUrls.join('\n'),
        })}`,
      );

    const player = await ts.getUser(message);
    const level = await ts.getExistingLevel(code);
    const existingPlay = await ts.db.Plays.query()
      .where('code', '=', level.id)
      .where('player', '=', player.id)
      .first();

    const isPlaysCommand =
      playCommands.indexOf(command.command) !== -1;

    if (
      isPlaysCommand &&
      (!existingPlay || !existingPlay.completed)
    ) {
      ts.userError(
        `${await ts.message('addVids.noClear', {
          code: level.code,
        })}`,
      );
    }

    let reply;

    const updateJson = [];
    const insertJson = [];
    const removeJson = [];

    if (addCommands.indexOf(command.command) !== -1) {
      // adding
      let oldVids = [];
      let unassignedVids = [];
      let assignedVids = [];
      let allVids = [];
      if (playCommands.indexOf(command.command) === -1) {
        oldVids = await ts.db.Videos.query().where({
          level_id: level.id,
        });
        allVids = oldVids;
      } else {
        oldVids = await ts.db.Videos.query()
          .where({ level_id: level.id })
          .where({ play_id: existingPlay.id });
        unassignedVids = await ts.db.Videos.query()
          .where({ level_id: level.id })
          .whereNull('play_id');
        assignedVids = await ts.db.Videos.query()
          .where({ level_id: level.id })
          .whereNotNull('play_id')
          .where('play_id', '<>', existingPlay.id);
        allVids = await ts.db.Videos.query().where({
          level_id: level.id,
        });
      }

      const oldVidUrls = oldVids.map((x) => x.url.trim());
      const assignedVidUrls = assignedVids.map((x) => x.url.trim());
      const allVidUrls = allVids.map((x) => x.url.trim());

      for (const video of filteredUrl) {
        video.url = video.url.trim();

        if (allVidUrls.indexOf(video.url) !== -1) {
          if (isPlaysCommand) {
            if (assignedVidUrls.indexOf(video.url) !== -1) {
              ts.userError(
                await ts.message('addVids.alreadyUsed', {
                  video: video.url,
                }),
              );
            }

            for (const unassignedVid of unassignedVids) {
              if (unassignedVid.url === video.url) {
                updateJson.push({
                  id: unassignedVid.id,
                  level_id: level.id,
                  play_id: existingPlay.id,
                  submitter_id: player.id,
                  type: video.type,
                  url: video.url,
                });
                oldVidUrls.push(video.url.trim());
                break;
              }
            }
          }
        } else {
          insertJson.push({
            level_id: level.id,
            play_id: isPlaysCommand ? existingPlay.id : null,
            submitter_id: player.id,
            type: video.type,
            url: video.url,
          });

          oldVidUrls.push(video.url.trim());
        }

        // Check if url exists already on the level
        // If playscommand
        // Check if url already assigned to another player -> error

        // Check if url already used as a level vid but no play -> update to add this play
        // Else do nothing and inform the user that nothing was done
        // Else add the url and inform the user
      }

      if (insertJson.length === 0 && updateJson.length === 0) {
        ts.userError(
          `No new clear video added for "${level.level_name}" by ${
            level.creator
          }\n${await ts.message('addVids.currentVideos', {
            videos_str: oldVidUrls.join('\n'),
          })}`,
        );
      }
      reply =
        (await ts.message('addVids.haveNew', level)) +
        (!isPlaysCommand
          ? await ts.message('addVids.currentVideos', {
              videos_str: oldVidUrls.join('\n'),
            })
          : await ts.message('addVids.currentPlayVideos', {
              videos_str: oldVidUrls.join('\n'),
            }));
    } else {
      // removing
      if (
        !(level.creator === player.name || player.is_mod === 1) &&
        !isPlaysCommand
      ) {
        ts.userError('addVids.noPermission', level);
      }

      let oldVids = [];
      if (playCommands.indexOf(command.command) === -1) {
        oldVids = await ts.db.Videos.query().where({
          level_id: level.id,
        });
      } else {
        oldVids = await ts.db.Videos.query()
          .where({ level_id: level.id })
          .where({ play_id: existingPlay.id });
      }

      const oldVidUrls = oldVids.map((x) => x.url.trim());

      for (const video of filteredUrl) {
        video.url = video.url.trim();

        for (const oldVid of oldVids) {
          if (oldVid.url === video.url) {
            removeJson.push({
              id: oldVid.id,
            });
            oldVidUrls.splice(oldVidUrls.indexOf(video.url), 1);
            break;
          }
        }
      }

      if (removeJson.length === 0) {
        ts.userError(
          (await ts.message('addVids.noRemoved', level)) +
            (await ts.message('addVids.currentVideos', {
              videos_str: oldVidUrls.join('\n'),
            })),
        );
      }
      reply =
        (await ts.message('addVids.haveRemoved', level)) +
        (await ts.message('addVids.currentVideos', {
          videos_str: oldVidUrls.join('\n'),
        }));
    }

    if (insertJson.length > 0) {
      for (const row of insertJson) {
        await ts.db.Videos.query().insert(row);
      }
    }

    if (updateJson.length > 0) {
      for (const row of updateJson) {
        await ts.db.Videos.query().where('id', row.id).update(row);
      }
    }

    if (removeJson.length > 0) {
      for (const row of removeJson) {
        await ts.db.Videos.query().where('id', row.id).del();
      }
    }

    await ts.discord.messageSend(message, player.userReply + reply);
  }
}
module.exports = TSAddvids;
