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

      if(!ts.valid_code(code))
        ts.userError(ts.message("error.invalidCode"))

      const level_name=command.arguments.join(" ")

      if(!level_name)
        ts.userError(ts.message("add.noName"))

      await ts.gs.loadSheets(["Raw Members","Raw Levels"]);
      const player=await ts.get_user(message);
      var existing_level=ts.gs.select("Raw Levels",{"Code":code})

      if(existing_level)
        ts.userError(ts.message("add.levelExisting",{level:existing_level}));

      if(player.earned_points.available.toFixed(1)<0)
        ts.userError(ts.message("points.cantUpload",{points_needed:Math.abs(player.earned_points.available).toFixed(1)}));

      await ts.gs.insert("Raw Levels",{
        Code:code,
        "Level Name":level_name,
        Creator:player.Name,
        Difficulty:0,
        Approved:0
      })

      var reply=ts.message("add.success",{level_name,code})
      message.channel.send(player.user_reply+reply)
    }
}
module.exports = tsadd;