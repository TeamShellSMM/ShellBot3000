/* istanbul ignore file */

module.exports = {
  clientCache: null,
  async log(info, discordClient) {
    console.log(info);
    if (!this.clientCache) this.clientCache = discordClient;
    if (!discordClient && this.clientCache)
      discordClient = this.clientCache;
    if (
      discordClient &&
      process.env.NODE_ENV === 'production' &&
      process.env.ERROR_CHANNEL
    ) {
      const channel = await discordClient.channels.get(
        process.env.ERROR_CHANNEL,
      );
      info = JSON.stringify(info, null, 2).replace(/\\n/g, '\n');
      await channel.send(`\`\`\`bash\n${info}\`\`\``);
    }
  },
  async error(error, discordClient) {
    console.error(error);
    if (!this.clientCache) this.clientCache = discordClient;
    if (!discordClient && this.clientCache)
      discordClient = this.clientCache;
    if (
      discordClient &&
      process.env.NODE_ENV === 'production' &&
      process.env.ERROR_CHANNEL
    ) {
      const channel = await discordClient.channels.get(
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
