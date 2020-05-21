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

  channel(search, parentID) {
    if (!search) {
      return false;
    }

    const searchl =
      typeof search === 'string' ? search.toLowerCase() : search;
    return this.guild().channels.find(
      (c) =>
        (c.name === searchl || c.id === searchl) &&
        (!parentID ||
          (parentID && this.channel(parentID).id === c.parentID)),
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

  async removeChannel(search, reason) {
    return this.channel(search).delete(reason);
  }

  async send(search, content) {
    debug(`Sending ${content} to '${search}'`);
    return this.channel(search).send(content);
  }

  static channel(channelId) {
    return this.channels.get(channelId);
  }

  static async send(channelId, content) {
    return DiscordWrapper.channel(channelId).send(content);
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

  /** discord message processing wrappers */

  /**
   * Get author's discord id from a message
   * @param {Message} message
   */
  getAuthor(message) {
    if (!message || !message.author) return null;
    return message.author.id;
  }

  /**
   * Get content of a message
   * @param {Message} message
   */
  getContent(message) {
    if (!message) return null;
    return message.content;
  }

  /**
   * Get channel id of a message
   * @param {Message} message
   */
  messageGetChannel(message) {
    if (!message || !message.channel) return null;
    return message.channel.id;
  }

  /**
   * Get channel name of a message
   * @param {Message} message
   */
  messageGetChannelName(message) {
    if (!message || !message.channel) return null;
    return message.channel.name;
  }

  /**
   * Get parent channel id of a message
   * @param {Message} message
   */
  messageGetParent(message) {
    if (!message || !message.channel) return null;
    return message.channel.parentID;
  }

  /**
   * @param {Message} message
   */
  getUsername(message) {
    if (!message || !message.author) return null;
    return message.author.username;
  }

  /**
   *
   * @param {Message} message
   */
  static messageGetGuild(message) {
    return message.guild.id;
  }

  /**
   * @param {Message} message
   * @param {any} content - The content you want to send back the originating channel
   */
  async messageSend(message, content) {
    return message.channel.send(content);
  }

  /**
   *  Helper function to check if a channel exists, then post an overviem message and pin it if there are no pins or update it if there are pins
   * @param {Channel} channel a discord channel object
   * @param {RichEmbed} embed Discord Rich Embed
   * @throws {TypeError} Will throw type errors if the arguments are not provided
   */
  async updatePinned(channelName, embed) {
    if (!channelName) throw new TypeError('channel name undefined');
    if (!embed) throw new TypeError('embed not defined');
    const channel = this.channel(channelName);
    let overviewMessage =
      process.env.NODE_ENV !== 'test'
        ? (await channel.fetchPinnedMessages()).last()
        : null;
    if (!overviewMessage) {
      overviewMessage = await channel.send(embed);
      if (overviewMessage) await overviewMessage.pin();
    } else {
      await overviewMessage.edit(embed);
    }
  }

  async dm(discordId, message) {
    return this.member(discordId).send(message);
  }
}
DiscordWrapper.MAX_DISCORD_SIZE = 50;
module.exports = DiscordWrapper;
