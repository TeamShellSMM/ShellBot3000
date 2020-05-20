const debug = require('debug')('shellbot3000:discord');
/**
 * The wrapper ShellBot uses to connect to Discord
 */
class DiscordWrapper {
  /**
   * @param {AkairoClient} client
   */
  constructor(guildId) {
    this.guildId = guildId;
    if (!this.guild())
      throw new Error(
        'Cannot find discord server. Invalid guild_id or ShellBot is not on this server.',
      );
  }

  static setClient(client) {
    this.client = client;
    if (!client) {
      throw new Error(`No client passed to DiscordWrapper()`);
    }
  }

  /**
   * @param {String} guildId
   * @returns {Guild}
   */
  guild() {
    return DiscordWrapper.client.guilds.get(this.guildId);
  }

  channel(search) {
    if (!search) {
      return false;
    }
    const searchl =
      typeof search === 'string' ? search.toLowerCase() : search;
    return this.guild().channels.find(
      (c) => c.name === searchl || c.id === searchl,
    );
  }

  async channelSize(search) {
    const channel = this.channel(search);
    return channel.children.size;
  }

  async renameChannel(oldName, newName) {
    debug(`renaming ${oldName} to ${newName}`);
    const oldChannel = this.channel(oldName);
    const newChannel = this.channel(newName);

    if (oldChannel && !newChannel) return oldChannel.setName(newName);
    return true;
  }

  async createChannel(name, { type = 'text', parent }) {
    debug(`creating ${name}`);
    const existingChannel = this.channel(name);
    const parentCategory =
      typeof parent === 'string' ? this.channel(parent) : parent;
    if (existingChannel) {
      debug(`${name} exists`);
      return this.setChannelParent(name, parent);
    }
    this.checkChannelFull(parent);
    return this.guild().createChannel(name, {
      type,
      parent: parentCategory,
    });
  }

  checkChannelFull(search) {
    const channel = this.channel(search);
    if (
      channel &&
      channel.children.size === DiscordWrapper.MAX_DISCORD_SIZE
    ) {
      throw new Error('channel full');
    }
  }

  async setChannelParent(search, parent) {
    this.checkChannelFull(parent);
    const channel = this.channel(search);
    const parentCategory = this.channel(parent);
    if (
      channel &&
      parentCategory &&
      channel.parentID !== parentCategory.id
    ) {
      debug(`Changing ${search} to be under ${parent}`);
      return channel.setParent(parentCategory.id);
    }
    return true;
  }

  async removeChannel(search, message) {
    return this.channel(search).delete(message);
  }

  async send(search, message) {
    debug(`Sending ${message} to '${search}'`);
    return this.channel(search).send(message);
  }

  static channel(channelId) {
    return this.channels.get(channelId);
  }

  static async send(channelId, message) {
    return DiscordWrapper.channel(channelId).send(message);
  }

  member(discordId) {
    return this.guild().members.get(discordId);
  }

  async removeRoles(discordId, roleId) {
    return this.member(discordId).removeRoles(roleId);
  }

  async addRole(discordId, roleId) {
    const currMember = this.member(discordId);
    if (!currMember) return false;
    return currMember.addRole(roleId);
  }

  async reply(message, content) {
    return DiscordWrapper.reply(message, content);
  }

  static async reply(message, content) {
    return message.reply(content);
  }

  embed() {
    return DiscordWrapper.client.util.embed();
  }

  async dm(discordId, message) {
    return this.member(discordId).send(message);
  }
}
DiscordWrapper.MAX_DISCORD_SIZE = 50;
module.exports = DiscordWrapper;
