const TSCommand = require('../TSCommand.js');
class SetWorld extends TSCommand {
    constructor() {
        super('setworld', {
           aliases: ['setworld'],
            args: [],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,{ world_count, level_count, world_name }) {
      const player=await ts.get_user(message);

      await ts.db.Members
        .query()
        .patch({world_world_count:0, world_level_count:0, world_description: ""})
        .where({discord_id:message.author.id})

      message.channel.send(player.user_reply+ts.message("unsetworld.success",{ code }))
    }
}
module.exports = SetWorld;