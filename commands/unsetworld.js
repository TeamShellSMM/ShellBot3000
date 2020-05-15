const TSCommand = require('../TSCommand.js');
class UnsetWorld extends TSCommand {
    constructor() {
        super('unset', {
           aliases: ['unset','unsetworld'],
            args: [],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message) {
      const player=await ts.get_user(message);

      await ts.db.Members
        .query()
        .patch({world_world_count:0, world_level_count:0, world_description: ""})
        .where({discord_id:message.author.id})

      message.channel.send(player.user_reply+ts.message("unsetworld.success"))
    }
}
module.exports = UnsetWorld;