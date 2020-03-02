const { Command } = require('discord-akairo');
class TSClear extends Command {
    constructor() {
        super('tsclear', {
           aliases: ['tsclear2','clear2'],
            args: [{
                    id: 'code',
                    type: 'string',
                    default: ''
                },{
                    id: 'difficulty',
                    type: 'string',
                    default: ''
                },{
                    id: 'like',
                    type: 'string',
                    default: ''
                }],
           channelRestriction: 'guild'
        });
    }
    
    async exec(message,args) {     
        var user_reply="<@"+message.author.id+">"
        await gs.loadSheets(["Raw Members","Raw Levels","Raw Played"]);
        var player=gs.select("Raw Members",{
          "discord_id":message.author.id
        })
        args.code=args.code.toUpperCase()


        

        try{
            if(!player) throw "You haven't registered yet"
            var earned_points=ts.calculatePoints(player.Name) 
            var rank=ts.get_rank(earned_points.clearPoints)
            user_reply+=rank.Pips+" "


            if(!ts.valid_format(args.code)) throw "Level code given was not in xxx-xxx-xxx format "+ts.emotes.think
            if(!ts.valid_code(args.code))   throw "There were some invalid characters in your level code "+ts.emotes.think

            if(args.difficulty.toUpperCase()=="LIKE"){
               args.difficulty=""
               args.like=1
            }
        
            var existing_level=gs.select("Raw Levels",{"Code":args.code})
             if(
                !existing_level || //level doesn't exist
                !(existing_level.Approved==0 || existing_level.Approved==1) //level is removed. not pending/accepted
               ){
                throw "Level code was not found in Team Shell's list "+ts.emotes.think;
              }

            var existing_play=gs.select("Raw Played",{"Code":args.code,"Player":player.Name})
            var creator=gs.select("Raw Members",{"Name":existing_level.Creator})

          var updates=[]
          if(
            user.shelder && 
            existing_level.Approved=="0" && 
            args.difficulty 
          ){      //still pending
            var approve=gs.query("Raw Levels",{
              filter:{"Code":args.code},
              update:{"Approved":1,"Difficulty":args.difficulty}
            })
            updates.push(approve)

            if(creator.cult_member!="1"){
              var update_creator=gs.query("Raw Members",{
                filter:{"Name":existing_level.Creator},
                update:{"cult_member":"1"}
              })
              updates.push(update_creator)
            }
          } 

          console.log(message.content)
          console.log(updates)
          


            var msg=""
            message.channel.send(user_reply+msg)    
        } catch(e){
            message.channel.send(user_reply+e)
        }
    }
}
module.exports = TSClear;