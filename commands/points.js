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
        this.defaultMessage({
          "points.points":
            "You have {{player.earned_points.clearPoints}} clear points. You have submitted {{player.earned_points.levelsMade}} level(s)"+
            "{{#if player.earned_points.freeSubmissions}}{{player.earned_points.freeSubmissions}} free submission(s){{/if}}.",
          "points.canUpload":"You have enough points to upload a level {{{PigChamp}}}",
          "points.cantUpload":"You need {{points_needed}} points to upload a new level {{{buzzyS}}}. Check how the points are mapped on {{teamurl}}",
          "points.rank":" You have earned the rank **{{player.rank.Rank}}** {{{player.rank.Pips}}}",
        })
    }

    async tsexec(ts,message,args) {
        await ts.gs.loadSheets(["Raw Members","Raw Levels"]);
        const player=await ts.get_user(message);

        var all_ranks=ts.gs.select("TeamShell Ranks");
        var all_ranks_id=all_ranks.map(r=>r.discord_roles)
        if(args.role=="role" || args.role=="norole"){
          await message.member.removeRoles(all_ranks_id)
        }
        if(args.role=="role"){
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