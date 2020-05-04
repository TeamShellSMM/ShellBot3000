const TSCommand = require('../TSCommand.js');
class tsadd extends TSCommand {
    constructor() {
        super('tsadd', {
           aliases: ['tsadd','add'],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,args) {
      let command=ts.parse_command(message);
      let code=command.arguments.shift()
      if(code)
        code=code.toUpperCase()

      if(!code) ts.userError(ts.message('error.noCode'));
      if(!ts.valid_code(code)) ts.userError(ts.message("error.invalidCode"));

      const level_name=command.arguments.join(" ")

      if(!level_name)
        ts.userError(ts.message("add.noName"))

      const player=await ts.get_user(message);
      var existing_level=await ts.getLevels().where({ code }).first()

      if(existing_level) ts.userError(ts.message("add.levelExisting",{level:existing_level}));

      if(player.earned_points.available.toFixed(1)<0)
        ts.userError(ts.message("points.cantUpload",{points_needed:Math.abs(player.earned_points.available).toFixed(1)}));


      await ts.db.Levels.query().insert({
        code,
        level_name,
        creator:player.id,
        difficulty:0,
        tags: ts.teamVariables.allowSMM1 && ts.is_smm1(code) ? 'SMM1' : '',
        status:0,
      })
      await ts.recalculateAfterUpdate({name:player.name})

      await message.channel.send(player.user_reply+ts.message("add.success",{level_name,code}))
    }
}
module.exports = tsadd;