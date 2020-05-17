/* istanbul ignore file */

'use strict';

module.exports = {
  clientCache: null,
  async log(info, discord_client) {
    console.log(info);
    if (!this.clientCache) this.clientCache = discord_client;
    if (!discord_client && this.clientCache)
      discord_client = this.clientCache;
    if (
      discord_client &&
      process.env.NODE_ENV === 'production' &&
      process.env.ERROR_CHANNEL
    ) {
      const channel = await discord_client.channels.get(
        process.env.ERROR_CHANNEL,
      );
      const dev = info.channel ? ` at ${info.channel}` : '';
      info = JSON.stringify(info, null, 2).replace(/\\n/g, '\n');
      await channel.send(`\`\`\`bash\n${info}\`\`\``);
    }
  },
  async error(error, discord_client) {
    console.error(error);
    if (!this.clientCache) this.clientCache = discord_client;
    if (!discord_client && this.clientCache)
      discord_client = this.clientCache;
    if (
      discord_client &&
      process.env.NODE_ENV === 'production' &&
      process.env.ERROR_CHANNEL
    ) {
      const channel = await discord_client.channels.get(
        process.env.ERROR_CHANNEL,
      );
      const devs = process.env.DEVS
        ? process.env.DEVS.split(',')
        : [];
      const devStr = `<@${devs.join('>,<@')}> ${
        error.channel ? ` at ${error.channel}` : ''
      }`;
      error = JSON.stringify(error, null, 2).replace(/\\n/g, '\n');
      channel.send(`${devStr}\`\`\`fix\n${error}\`\`\``);
    }
  },
};
