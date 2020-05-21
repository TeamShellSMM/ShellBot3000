/* istanbul ignore file */
const DiscordWrapper = require('./DiscordWrapper');

module.exports = {
  clientCache: null,
  async log(info) {
    console.log(info);
    if (
      DiscordWrapper.client &&
      process.env.NODE_ENV === 'production' &&
      process.env.ERROR_CHANNEL
    ) {
      const infoStr = JSON.stringify(info, null, 2).replace(
        /\\n/g,
        '\n',
      );
      await DiscordWrapper.send(
        process.env.ERROR_CHANNEL,
        `\`\`\`bash\n${infoStr}\`\`\``,
      );
    }
  },
  async error(error) {
    console.error(error);

    if (
      DiscordWrapper.client &&
      process.env.NODE_ENV === 'production' &&
      process.env.ERROR_CHANNEL
    ) {
      const devs = process.env.DEVS
        ? process.env.DEVS.split(',')
        : [];
      const devStr = `<@${devs.join('>,<@')}> ${
        error.channel ? ` at ${error.channel}` : ''
      }`;
      const errorStr = JSON.stringify(error, null, 2).replace(
        /\\n/g,
        '\n',
      );
      await DiscordWrapper.send(
        process.env.ERROR_CHANNEL,
        `${devStr}\`\`\`fix\n${errorStr}\`\`\``,
      );
    }
  },
};
