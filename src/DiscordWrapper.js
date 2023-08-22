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
    if (!client) {
      throw new Error(`No client passed to DiscordWrapper()`);
    }
    this.client = client;
  }

  /**
   * @param {String} guildId
   * @returns {Guild}
   */
  guild() {
    return DiscordWrapper.client.guilds.cache.get(this.guildId);
  }

  /**
   * @returns {Guild}
   */
  async fetchGuild() {
    return DiscordWrapper.client.guilds.fetch(
      this.guildId,
      true,
      true,
    );
  }

  botId() {
    return DiscordWrapper.client.user.id;
  }

  channel(search, parentID, exact = false) {
    debug(`finding ${search}`);
    if (search == null) {
      throw new Error(
        `Empty channel name or id is passed to discordwrapper.channel`,
      );
    }

    const searchl = search.toLowerCase();
    const parent = parentID ? this.channel(parentID) : null;
    return this.guild().channels.cache.find((c) => {
      const untaggedName = c.name.toLowerCase().split(/[^0-9a-z-]/g);
      return (
        ((!exact &&
          untaggedName[untaggedName.length - 1] === searchl) ||
          c.name === searchl ||
          c.id === searchl) &&
        (!parent || (parent && parent.id === c.parentID))
      );
    });
  }

  channels(search, parentID, exact = false) {
    debug(`finding ${search}`);
    if (search == null) {
      throw new Error(
        `Empty channel name or id is passed to discordwrapper.channel`,
      );
    }

    const searchl = search.toLowerCase();
    const parent = parentID ? this.channel(parentID) : null;
    return this.guild().channels.cache.filter((c) => {
      const untaggedName = c.name.toLowerCase().split(/[^0-9a-z-]/g);
      return (
        ((!exact &&
          untaggedName[untaggedName.length - 1] === searchl) ||
          c.name === searchl ||
          c.id === searchl) &&
        (!parent || (parent && parent.id === c.parentID))
      );
    });
  }

  channelSize(search) {
    if (!search) {
      throw new Error(
        `Empty channel name or id is passed to discordwrapper.channelSize`,
      );
    }
    const channel = this.channel(search);
    if (!channel)
      throw new Error(
        'Cannot find the channel category in channelSize()',
      );
    return channel.children.size;
  }

  async setTopic(channelName, topic) {
    debug(`setting topic of ${channelName} to ${topic}`);
    const channel = this.channel(channelName);

    if (!channel) return false;
    await channel.setTopic(topic);

    return true;
  }

  async getTopic(channelName) {
    debug(`getting topic of ${channelName}`);
    const channel = this.channel(channelName);

    if (!channel) return false;
    return channel.topic;
  }

  async renameChannel(oldName, newName) {
    debug(`renaming ${oldName} to ${newName}`);
    const oldChannel = this.channel(oldName);
    const newChannel = this.channel(newName, null, true);

    if (!oldChannel) return false;

    if (oldChannel.name.toLowerCase() === newName.toLowerCase()) {
      debug(`channel already ${newName}`);
      return false;
    }

    if (!newChannel) {
      debug(`found oldChannel and no newChannel. renaming`);
      // TODO: it seems that we ger rate limited here
      // I think this is what we have to do unfortunately
      const result = await oldChannel.setName(newName);
      this.guild().channels.cache.delete(result.id);
      this.guild().channels.cache.set(result.id, result);
      return result;
    }
    debug(`Did not find old channel or found new channel`);
    return false;
  }

  async createChannel(name, args = {}) {
    const { type = 'text', parent, topic } = args;
    debug(`creating ${name}`);
    const existingChannel = this.channel(name);
    const parentCategory =
      typeof parent === 'string' ? this.channel(parent) : parent;
    if (existingChannel) {
      debug(`${name} exists`);
      return this.setChannelParent(name, parent);
    }
    this.checkChannelFull(parent);
    return this.guild().channels.create(name, {
      type,
      parent: parentCategory,
      topic: topic,
    });
  }

  checkChannelFull(search) {
    if (!search) return false;
    const channel = this.channel(search);
    if (
      channel &&
      channel.children &&
      channel.children.size >= DiscordWrapper.MAX_DISCORD_SIZE
    ) {
      throw new Error('channel full');
    }
    return true;
  }

  /**
   * @param {string} role Role id or name
   * @returns {string[]} an array of user discord ids
   */
  getMembersWithRole(role) {
    const guild = this.guild();
    return guild.members.cache
      .filter((m) =>
        m.roles.cache.some((r) => r.name === role || r.id === role),
      )
      .map((m) => m.user.id);
  }

  /**
   * @param {string} discord_id discord id of the member you want
   * @returns {GuildMember} the found guild member
   */
  getMember(discord_id) {
    const guild = this.guild();
    return guild.members.cache.find((m) => m.id === discord_id);
  }

  async setChannelParent(search, parent) {
    this.checkChannelFull(parent);
    if (!parent) return false;
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
    const channel = this.channel(search);
    if (channel) {
      const { id } = channel;
      const result = await channel.delete(reason);
      this.guild().channels.cache.delete(id);
      return result;
    }
    return false;
  }

  async send(search, content) {
    debug(`Sending ${content} to '${search}'`);
    return this.channel(search).send(content);
  }

  static channel(channelId) {
    return this.client.channels.cache.get(channelId);
  }

  static async send(channelId, content) {
    return DiscordWrapper.channel(channelId).send(content);
  }

  member(discordId) {
    return this.guild().members.cache.get(discordId);
  }

  async fetchMember(discordId, cache = true, forceApi = false) {
    return this.guild().members.fetch(discordId, cache, forceApi);
  }

  async removeRoles(discordId, roleIdArg) {
    let roleId = roleIdArg;
    const currMember = this.member(discordId);
    if (!currMember) return false;

    if (roleId == null) {
      return null;
    }
    if (roleId instanceof Array) {
      roleId = roleId.filter((x) => x !== null);
    }

    const r = await currMember.roles.remove(roleId);
    // console.log("done with remove");

    return r;
  }

  hasRole(discordId, roleId) {
    const currMember = this.member(discordId);
    if (!currMember || !currMember.roles) return false;
    return currMember.roles.cache.some(
      (r) =>
        r.id === roleId ||
        r.name.toLowerCase() === roleId.toLowerCase(),
    );
  }

  // Checks if the user has one of the supplied roles
  hasRoleList(discordId, roleIds) {
    const roleIdsLower = [];
    for (const roleId of roleIds) {
      if (typeof roleId === 'string') {
        roleIdsLower.push(roleId.toLowerCase());
      }
    }
    const currMember = this.member(discordId);
    if (!currMember || !currMember.roles) return false;
    return currMember.roles.cache.some(
      (r) =>
        roleIdsLower.indexOf(r.id) !== -1 ||
        roleIdsLower.indexOf(r.name.toLowerCase()) !== -1,
    );
  }

  async addRole(discordId, roleId) {
    const currMember = this.member(discordId);
    if (!currMember) return false;
    if (this.hasRole(discordId, roleId)) return false;

    // console.log("adding role", roleId);
    const r = await currMember.roles.add(roleId);
    // console.log("done with add");
    return r;
  }

  async reply(message, content) {
    return DiscordWrapper.reply(message, content);
  }

  async sendChannel(channel, content) {
    return DiscordWrapper.sendChannel(channel, content);
  }

  static async reply(message, content) {
    return message.reply(content);
  }

  static async sendChannel(channel, content) {
    return channel.send(content);
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
    debug(`Update pin for ${channelName}`);
    if (!channelName) throw new TypeError('channel name undefined');
    if (!embed) throw new TypeError('embed not defined');
    const channel = this.channel(channelName);
    debug(`fetching pinned messages ${channelName}`);
    let overviewMessage = (
      await channel.messages.fetchPinned()
    ).last();
    if (!overviewMessage) {
      debug(
        `No pin found for ${channelName}. Sending message and pinning it`,
      );
      overviewMessage = await this.send(channelName, embed);
      return overviewMessage.pin();
    }
    debug(`Pin found for ${channelName}. Editing it`);
    return overviewMessage.edit(embed);
  }

  async updateChannelPinnedEmbed(channel, embed) {
    if (!channel) throw new TypeError('channel undefined');
    if (!embed) throw new TypeError('embed not defined');
    const overviewMessage = (
      await channel.messages.fetchPinned()
    ).last();
    if (!overviewMessage) {
      /* overviewMessage = await channel.send(embed);
      return overviewMessage.pin(); */
      return null;
    }
    return overviewMessage.edit(embed);
  }

  async dm(discordId, message) {
    return this.member(discordId).send(message);
  }
}
DiscordWrapper.MAX_DISCORD_SIZE = 50;
module.exports = DiscordWrapper;
