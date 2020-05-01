const TSCommand = require('../TSCommand.js');
class SetWorld extends TSCommand {
    constructor() {
        super('setworld', {
           aliases: ['setworld'],
            args: [{
                    id: 'world_count',
                    type: 'string',
                    default: ''
                },
                {
                    id: 'level_count',
                    type: 'string',
                    default: ''
                },
                {
                    id: 'world_name',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,{ world_count, level_count, world_name }) {
      world_count = parseInt(world_count);
      level_count = parseInt(level_count);

      if(!world_count) ts.userError(ts.message('setworld.invalidWorldCount'));
      if(!level_count) ts.userError(ts.message('setworld.invalidLevelCount'));
      if(!world_name) ts.userError(ts.message('setworld.noWorldName'));

      const player=await ts.get_user(message);

      if(!player.maker_id || !player.maker_name){
        ts.userError(ts.message('setworld.noMakerId'));
      }

      await ts.db.Members
        .query()
        .patch({world_world_count:world_count, world_level_count:level_count, world_description: world_name})
        .where({discord_id:message.author.id})


      message.channel.send(player.user_reply+ts.message("setworld.success",{ code }))
    }
}
module.exports = SetWorld;