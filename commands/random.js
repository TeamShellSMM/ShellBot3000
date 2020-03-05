const { Command } = require('discord-akairo');
class tsrandom extends Command {
    constructor() {
        super('tsrandom', {
           aliases: ['tsrandom'],
            args: [{
                    id: 'minDifficulty',
                    type: 'string',
                    default: ''
                },{
                    id: 'maxDifficulty',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }
    
    async exec(message,args) {     
         //if(!( 
        //    message.channel.id === ts.channels.shellderShellbot  //only in bot-test channel
        //)) return false;
      try {
        await gs.loadSheets(["Raw Members","Raw Levels","Raw Played"]); //when everything goes through shellbot 3000 we can do cache invalidation stuff
  
        const player=gs.select("Raw Members",{
          "discord_id":message.author.id
        })

        if(!player)
          ts.userError("You are not yet registered");
        const earned_points=ts.calculatePoints(player.Name);
        const rank=ts.get_rank(earned_points.clearPoints);
        const user_reply="<@"+message.author.id+">"+rank.Pips+" ";

        if(args.minDifficulty && !ts.valid_difficulty(args.minDifficulty)){
          ts.userError(args.maxDifficulty? "You didn't specify a valid minimum difficulty" : "You didn't specify a valid difficulty")
        }
        

        if(args.maxDifficulty){
          if(!ts.valid_difficulty(args.maxDifficulty))
            ts.userError("You didn't specify a valid maxDifficulty")
        } else {
          if(args.minDifficulty){
            args.maxDifficulty=args.minDifficulty
          }
        }


        const levels=ts.get_levels(true) //get levels with aggregates and stats
        var difficulties=[]
        var played=[];
        gs.select("Raw Played",{"Player":player.Name,"Completed":1}).forEach((clear)=>{
          const level=levels[clear.Code]
          if(level && level.Approved=="1"){
            played.push(level.Code)
            difficulties.push(level.Difficulty)
          }
        })

        if(args.minDifficulty){
          var min=args.minDifficulty
          var max=args.maxDifficulty
        } else {
          if(difficulties.length>0){
            var middle=(difficulties.length-1)/2
            console.log(middle)
            var min=difficulties[Math.floor(middle)]
            console.log(min)
            var max=difficulties[Math.ceil(middle)]
            console.log(max)
            difficulties.sort(function(a,b){
              return parseFloat(a)-parseFloat(b)
            })
          } else {
            var min=0.5
            var max=1
          }
        }

        
        console.log(min)
        console.log(max)
        //console.log(difficulties)
        //console.log(played)

        var reply=""
        message.channel.send(user_reply+reply)
      } catch (error) {
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = tsrandom;