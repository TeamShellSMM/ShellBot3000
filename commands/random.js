const { Command } = require('discord-akairo');

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

class tsrandom extends Command {
    constructor() {
        super('tsrandom', {
           aliases: ['tsrandom','random'],
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

        if(args.minDifficulty>args.maxDifficulty){
          let temp=args.maxDifficulty
          args.maxDifficulty=args.minDifficulty
          args.minDifficulty=temp
        }

        await gs.loadSheets(["Raw Members","Raw Levels","Raw Played"]); //when everything goes through shellbot 3000 we can do cache invalidation stuff
        const player=gs.select("Raw Members",{
          "discord_id":message.author.id
        })

        if(!player)
          ts.userError("You are not yet registered");
        const earned_points=ts.calculatePoints(player.Name);
        const rank=ts.get_rank(earned_points.clearPoints);
        const user_reply="<@"+message.author.id+">"+rank.Pips+" ";


        const levels=ts.get_levels(true) //get levels with aggregates and stats
        var difficulties=[]
        var played=[];
        gs.select("Raw Played",{"Player":player.Name,"Completed":1},true).forEach((clear)=>{
          const level=levels[clear.Code]
          if(level && level.Approved=="1" && level.Creator!=player.Name){
            played.push(level.Code)
            difficulties.push(level.Difficulty)
          }
          if(level && level.Creator==player.Name){
            played.push(level.Code)
          }
        })

        if(args.minDifficulty){
          var min=args.minDifficulty
          var max=args.maxDifficulty
        } else {
          if(difficulties.length>0){
            var middle=(difficulties.length-1)/2
            difficulties.sort(function(a,b){
              return parseFloat(a)-parseFloat(b)
            })
            var min=difficulties[Math.floor(middle)]
            var max=difficulties[difficulties.length-1]
          } else {
            var min=0.5
            var max=1
          }
        }

        min=parseFloat(min)
        max=parseFloat(max)

        var filtered_levels=[]
        ts.get_levels().forEach((level)=>{
          var currDifficulty=parseFloat(level.Difficulty)
          if(
            level.Approved=="1" &&
            currDifficulty>=min &&
            currDifficulty<=max &&
            played.indexOf(level.Code)==-1
          ){
            filtered_levels.push(level)
          }
        })
        filtered_levels.sort(function(a,b){
          return parseFloat(a.likes)-parseFloat(b.likes)
        })
        if(filtered_levels.length==0){
          ts.userError("You have ran out of levels in this range")
        }

        var borderLine=Math.floor(filtered_levels.length*0.6)
        if(Math.random()<0.2){
          var randNum=getRandomInt(0,borderLine)
        } else {
          var randNum=getRandomInt(borderLine,filtered_levels.length)
        }
        var level=filtered_levels[randNum]
        var randomEmbed=ts.levelEmbed(level).setAuthor("ShellBot rolled a d97 and found this level for you")

        await message.channel.send(user_reply)
        await message.channel.send(randomEmbed)
      } catch (error) {
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = tsrandom;