const config = require('../config.json');
const TSCommand = require('../TSCommand.js');
const { Command } = require('discord-akairo');


class TestBot extends Command {
    constructor() {
        super('test', {
          aliases: ['test'],
          prefix:'?',
        });
    }

    async canRun(ts,message){
        if(config.AutomatedTest!==message.guild.id){
            return false
        }

        if(config.ownerID && config.ownerID.indexOf(message.author.id)!==-1){
            return true;
        }
        if(config.devs && config.devs.indexOf(message.author.id)!==-1){
            return true;
        }
        
        if(message.author.id==ts.client.user.id){
            return true;
        }
        
          
        return false;
    }


    async exec(message,args) {
        
        let ts;
        try {
            ts=get_ts(message.guild.id)
        } catch(error){
            message.reply(error)
            throw error;
        }

        const bot_id=ts.client.user.id
        const bot_reply=`<@${bot_id}>`
        const guild=ts.getGuild()

        function _sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function clearDb(){
            await ts.db.Members.query().select().del()
            await ts.db.Levels.query().select().del()
            await ts.db.PendingVotes.query().select().del()
            await ts.db.Plays.query().select().del()
        }
        async function makeMember(name){
            await ts.db.Members.query().insert({
                name:name,
                discord_id:'1',
            })
        }
    
        const defaultChannel="703205477491671090"
        const TESTOPTIONS=[
            {
                setup:async function(){
                    await clearDb();
                    await makeMember('mockMod1')
                    await makeMember('mockPlayer1')
                },
                description:'Check !points when not registered',
                cmd:'!points',
                expected:ts.message('error.notRegistered')+ts.message('error.afterUserDiscord'),
            },{
                description:'registering with existing name',
                cmd:'!register mockPlayer1',
                expected:ts.message('register.nameTaken',{name:'mockPlayer1'})+ts.message('error.afterUserDiscord'),
            },{
                description:'register as mockCreator',
                cmd:'!register mockCreator',
                expected:ts.message('register.succesful',{name:'mockCreator'}),
            },
            {
                cmd:'!add',
                expected:ts.message('error.noCode')+ts.message('error.afterUserDiscord'),
            },
            {
                cmd:'!add xxx-xxx-xx',
                expected:ts.message('error.invalidCode')+ts.message('error.afterUserDiscord'),
            },{
                cmd:'!add xxx-xxx-xx level name is long',
                expected:ts.message('error.invalidCode')+ts.message('error.afterUserDiscord'),
            },{
                cmd:'!add xxx-xxx-xxx',
                expected:ts.message('add.noName')+ts.message('error.afterUserDiscord'),
            },
            {
                cmd:'!add xxx-xxx-xxx level name is long',
                expected:bot_reply+' '+ts.message('add.success',{
                    level_name:'level name is long',
                    code:'XXX-XXX-XXX',
                }),
            },{
                //'add.levelExisting':'`{{level.code}}` has already been submitted as \'{{{level.level_name}}}\' by {{level.creator}}',
                cmd:'!add xxx-xxx-xxx long',
                expected:ts.message('add.levelExisting',{
                    level:{
                        level_name:'level name is long',
                        code:'XXX-XXX-XXX',
                        creator:'mockCreator'
                    },
                })+ts.message('error.afterUserDiscord'),
            },
            {
                cmd:'!clear xxx-xxx-xx',
                expected:"The code XXX-XXX-XX was not found in TeamJamp's list.Did you mean:```\n" +
                'XXX-XXX-XXX - "level name is long" by mockCreator``` ',
            },{
                cmd:'!clear xxx-xxx-xxx',
                expected:ts.message('clear.ownLevel')+ts.message('error.afterUserDiscord'),
                
            },{
                cmd:'!mockuser mockPlayer1',
                expected:`You're now mockPlayer1. Identity theft is not a joke, Jim!`,
            },{
                cmd:'!points',
                expected:bot_reply+' '
                    +ts.message('points.points',{
                        player:{
                            earned_points:{
                                clearPoints:'0.0',
                                levelsMade:0,
                            },
                        },
                    })+ts.message('points.canUpload')+ts.message('points.rank',{
                        player:{
                            rank:ts.ranks[0],
                        },
                    }),
            },{
                cmd:'!clear xxx-xxx-xxx',
                expected:bot_reply+' \n ‣You have cleared \'level name is long\'  by mockCreator \n'+
                ' ‣This level is still pending',
            },
            {
                cmd:'!clear xxx-xxx-xxx',
                expected:'<@682946764755566609> \n' +
                " ‣You have already submitted a clear for 'level name is long'  by mockCreator",
            },
            {
                cmd:'!approve xxx-xxx-xxx',
                expected:ts.message('approval.invalidDifficulty')+ts.message('error.afterUserDiscord'),
        
            },{
                cmd:'!approve xxx-xxx-xxx 5',
                expected:ts.message('approval.changeReason')+ts.message('error.afterUserDiscord'),
            },{
                cmd:'!approve xxx-xxx-xxx 5 "some reason"',
                async expected(value){
                    try{
                      const newChannel=await guild.channels.find(c => c.name === 'xxx-xxx-xxx')
                      if(!newChannel) return false;
                      
                      return ts.message('approval.voteAdded',{channel_id:newChannel.id})==value

                    } catch (error){
                        console.log(error)
                        return false;
                    }
                }
            },{
                cmd:'!mockuser mockCreator',
                expected:"You're now mockCreator. Identity theft is not a joke, Jim!",
            },{
                cmd:'!judge',
                channel:"xxx-xxx-xxx",
                async expected(value){
                    const newChannel=await guild.channels.find(c => c.name === 'xxx-xxx-xxx')
                    return !newChannel

                    //not sure how to test initiation and show approval stuff
                },
            },{
                cmd:'!mockUser mockPlayer1',
                expected:"You're now mockPlayer1. Identity theft is not a joke, Jim!",
            },{
                cmd:'!points',
                expected:bot_reply+' '
                    +ts.message('points.points',{
                        player:{
                            earned_points:{
                                clearPoints:'5.0',
                                levelsMade:0,
                            },
                        },
                    })+ts.message('points.canUpload')+ts.message('points.rank',{
                        player:{
                            rank:ts.ranks[1],
                        },
                    }),
            },{
                cmd:'!points role',
                async expected(value){
                    
                    
                    let reply=bot_reply+' '
                    +ts.message('points.points',{
                        player:{
                            earned_points:{
                                clearPoints:'0.0',
                                levelsMade:0,
                            },
                        },
                    })+ts.message('points.canUpload')+ts.message('points.rank',{
                        player:{
                            rank:ts.ranks[0],
                        },
                    });
                    return reply==value
                }
        
            },{
                cmd:'!mockuser mockCreator',
            },{
                cmd:'!reupload xxx-xxx-xxx',
            },{
                cmd:'!reupload xxx-xxx-xxx xxx-xxx-xxx',
            },{
                cmd:'!reupload xxx-xxx-xxx xxx-xxx-yy',
            },{
                cmd:'!reupload xxx-xxx-xxx xxx-xxx-yyy',
            },{
                cmd:'!reupload xxx-xxx-xxx xxx-xxx-yyy "some reason"',
            },{
                cmd:'!fixapprove',
                channel:"xxx-xxx-yyy"
            }
        ];  

async function send({ setup, cmd , channel}){
    if((typeof setup)==="function"){
        await setup()
    }
    message.content=cmd
    channel=channel || defaultChannel
    if(/[^0-9]/.test(channel)){
        message.channel=await guild.channels.find(c => c.name === channel.toLowerCase())
    } else {
        message.channel=await guild.channels.get(channel)
    }
    await ts.client.emit("message",message)
}

async function test(value){
    let obj=TESTOPTIONS[i]
    if(typeof obj.expected==="function"){
        post_result({
            command:obj.cmd,
            value,
            expected:"function",
            result:await obj.expected(value),
        })
    } else {
        post_result({
            command:obj.cmd,
            value,
            expected:obj.expected,
            result:obj.expected==value,
        })
    }
}

let timeout_id;
global.console_error=console.log
global.TESTREPLY=async function(arg){
    clearTimeout(timeout_id)
    await test(arg)
    global.NEXTTEST()
}
let has_error=false;
function post_result(obj){
    let id=(i+1).toString().padEnd(4)
    if(obj.result){
        console.log(`#${id} ✅: ${obj.description || obj.command}`)
    } else {
        if(process.argv[3]=="stop") has_error=true;
        console.log(`#${id} ❌:`)
        console.log(obj)
    }
}

let i=-1;
global.NEXTTEST=async function(){
    i++
    await _sleep(1000)
    if(!has_error && i<TESTOPTIONS.length){
        send(TESTOPTIONS[i])
        timeout_id=setTimeout(async function(){
            await test();
            global.NEXTTEST()
        },2000)
    } else {
        console.log('--done--')
        process.exit()
    }
}
global.NEXTTEST()
        
    }
}
module.exports = TestBot;