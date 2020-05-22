const debug = require('debug')('shellbot3000:initchannel');
const TSCommand = require('../TSCommand.js');
const knex = require('../db/knex');
const { botPermissions, defaultChannels } = require('../constants');

class InitChannels extends TSCommand {
  constructor() {
    super('initchannels', {
      aliases: ['initchannels'],
    });
  }

  async canRun(ts, message) {
    return ts.teamAdmin(message.author.id);
  }

  async tsexec(ts, message) {
    const change = false;
    const channels = ts.getSettings('channels');
    for (let i = 0; i < defaultChannels.length; i += 1) {
      const c = defaultChannels[i];
      debug(`Check channel ${c.name}`);
      const existingChannel = channels[c.name]
        ? ts.discord.channel(channels[c.name])
        : false;
      const channelName = c.default;
      if (!existingChannel) {
        debug(`Didn't find existing channel. creating one`);
        const channelTemplate = {
          ...c,
          permissionOverwrites: [
            {
              id: ts.guildId,
              ...c.defaultPermission,
            },
            {
              id: ts.discord.botId(),
              ...botPermissions,
            },
          ],
        };

        let newChannel = ts.discord.channel(channelName);
        let newChannelName = channelName;
        if (!newChannel) {
          newChannel = await ts.discord.createChannel(
            channelName,
            channelTemplate,
          );
          const embed = ts.discord
            .embed()
            .setColor('#007bff')
            .setTitle('Channel Help');
          if (channelTemplate.type === 'category') {
            newChannelName = `${channelName}-help`;
            await ts.discord.createChannel(newChannelName, {
              parent: newChannel.id,
            });
            embed.setDescription(
              `\`\`\`fix\n${c.description}\n\`\`\``,
            );
          } else {
            embed.setDescription(
              `\`\`\`fix\n${c.description}\n\`\`\``,
            );
          }
          await ts.discord.send(newChannelName, embed);
        }
      }
      const existingRow = await knex('team_settings')
        .where({
          guild_id: ts.team.id,
        })
        .where({
          type: 'channels',
        })
        .where({
          name: c.name,
        })
        .first();
      const channelId = ts.discord.channel(channelName).id;
      if (existingRow) {
        debug(`Updating ${c.name} to ${channelId}`);
        await ts
          .knex('team_settings')
          .update({ value: channelId })
          .where({ id: existingRow.id });
      } else {
        debug(`Inserting ${c.name} with ${channelId}`);
        await knex('team_settings').insert({
          guild_id: ts.team.id,
          type: 'channels',
          name: c.name,
          value: channelId,
        });
      }
    }

    await ts.load();
    await ts.discord.reply(
      message,
      change ? 'Commands done' : 'Nothing was done',
    );
  }
}

module.exports = InitChannels;
