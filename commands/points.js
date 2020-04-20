const { Command } = require('discord-akairo');

class points extends Command {
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

    async exec(message,args) {
        try {
            var ts=get_ts(message.guild.id)
          } catch(error){
            message.reply(error)
            throw error;
          }

        try{
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

        var msg="You have "+player.earned_points.clearPoints+" clear points. You have submitted "+player.earned_points.levelsMade+" level"+ts.plural(player.earned_points.levelsMade)+" "+(player.earned_points.freeSubmissions?"("+player.earned_points.freeSubmissions+" free submission"+ts.plural(player.earned_points.freeSubmissions)+")":"")+". "

        if(player.earned_points.available>=0){
           msg+="You have enough points to upload a level "+ (ts.emotes.PigChamp ? ts.emotes.PigChamp : "");
        } else {
           msg+="You need "+Math.abs(player.earned_points.available).toFixed(1)+" points to upload a new level"+ (ts.emotes.buzzyS ? " " + ts.emotes.buzzyS : "")+". Check how the points are mapped on https://makerteams.net/" + ts.config.url_slug;
        }
        msg+=" You have earned the rank **"+player.rank.Rank+"** "+ (player.rank.Pips ? player.rank.Pips : "")

            message.channel.send(player.user_reply+msg)
        } catch (error) {
            message.reply(ts.getUserErrorMsg(error))
        }
    }
}
module.exports = points;