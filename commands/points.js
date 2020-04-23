const TSCommand = require('../TSCommand.js');

class points extends TSCommand {
    constructor() {
        super('points', {
           aliases: ['points','rank','point'],
            args: [{
                    id: 'role',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }

    async tsexec(ts,message,{ role }) {
        await ts.gs.loadSheets(["Raw Members","Raw Levels"]);
        const player=await ts.get_user(message);

        var all_ranks=ts.gs.select("Ranks");
        var all_ranks_id=all_ranks.map(r=>r.discord_roles)
        if(role=="role" || role=="norole"){
          await message.member.removeRoles(all_ranks_id)
        }
        if(role=="role"){
          await message.member.addRole(player.rank.discord_roles)
        }

        var msg=ts.message("points.points",{ player })

        if(player.earned_points.available>=0){
           msg+=ts.message("points.canUpload");
        } else {
           msg+=ts.message("points.cantUpload",{
             "points_earned":Math.abs(player.earned_points.available).toFixed(1)
           })
        }
        msg+=ts.message("points.rank",{ player })
        message.channel.send(player.user_reply+msg)
    }
}
module.exports = points;