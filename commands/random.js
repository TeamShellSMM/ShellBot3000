const { Command } = require('discord-akairo');
const Plays = require('../models/Plays');

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


        //console.time("loadSheets")
        await gs.loadSheets(["Raw Members","Raw Levels"]); //when everything goes through shellbot 3000 we can do cache invalidation stuff
        const player=gs.select("Raw Members",{
          "discord_id":message.author.id
        })
        //console.timeEnd("loadSheets")


        //console.time("get user")
        if(!player)
          ts.userError("You are not yet registered");
        const earned_points=await ts.calculatePoints(player.Name);
        const rank=ts.get_rank(earned_points.clearPoints);
        const user_reply="<@"+message.author.id+">"+rank.Pips+" ";
        //console.timeEnd("get user")


        //console.time("get levels")
        var allLevels=await ts.get_levels()
        let levels={}
        allLevels.forEach(o=>{
          levels[o.Code]=o
        })
        //const levels=await ts.get_levels(true) //get levels with aggregates and stats
        var difficulties=[]
        var played=[];

        //console.timeEnd("get levels")


        //console.time("get plays")
        var plays = await Plays.query()
          .where('player', '=', player.Name)
          .where('completed', 1);
        //console.timeEnd("get plays")


        //console.time("process plays")
        plays.forEach((clear)=>{
          const level=levels[clear.code]
          if(level && level.Approved=="1" && level.Creator!=player.Name){
            played.push(level.Code)
            difficulties.push(level.Difficulty)
          }
          if(level && level.Creator==player.Name){
            played.push(level.Code)
          }
        })
        //console.timeEnd("process plays")


        //console.time("process difficulties")
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
        //console.timeEnd("process difficulties")

        min=parseFloat(min)
        max=parseFloat(max)

        //console.time("getting the range of levels")

        //var filtered_levels=[]
        if(allLevels){
         var filtered_levels=allLevels.filter((level)=>{
            var currDifficulty=parseFloat(level.Difficulty)
            return level.Approved=="1" &&
              currDifficulty>=min &&
              currDifficulty<=max 
              && played.indexOf(level.Code)==-1
            
          })
        } else {
          throw "No levels found buzzyS"
        }
        //console.timeEnd("getting the range of levels")


        //console.time("sorting levels")
        filtered_levels.sort(function(a,b){
          return parseFloat(a.likes)-parseFloat(b.likes)
        })
        //console.timeEnd("sorting levels")
        if(filtered_levels.length==0){
          ts.userError("You have ran out of levels in this range")
        }

        //console.time("rolling dice")
        var borderLine=Math.floor(filtered_levels.length*0.6)
        if(Math.random()<0.2){
          var randNum=getRandomInt(0,borderLine)
        } else {
          var randNum=getRandomInt(borderLine,filtered_levels.length)
        }
        var level=filtered_levels[randNum]
        //console.timeEnd("rolling dice")

        //console.time("Making embed and send")
        var randomEmbed=ts.levelEmbed(level).setAuthor("ShellBot rolled a d97 and found this level for you")
        await message.channel.send(user_reply)
        await message.channel.send(randomEmbed)
        //console.timeEnd("Making embed and send")
      } catch (error) {
        message.reply(ts.getUserErrorMsg(error))
      }
    }
}
module.exports = tsrandom;