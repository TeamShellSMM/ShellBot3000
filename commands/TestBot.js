const config = require('../config.json');
const { Command } = require('discord-akairo');
class TestBot extends Command {
    constructor() {
        super('test', {
          aliases: ['test'],
          prefix:'?',
        });
    }

    async canRun(ts,message){
        //can only be run in with config is setup properly
        if(config.AutomatedTest!==message.guild.id) return false;

        if(config.ownerID && config.ownerID.indexOf(message.author.id)!==-1){
            return true;
        }
        if(config.devs && config.devs.indexOf(message.author.id)!==-1){
            return true;
        }
        
        //can be called by the bot itself
        if(message.author.id==ts.client.user.id) return true;
          
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
        const bot_reply=`<@${bot_id}> `
        const guild=ts.getGuild()
        message.author.id=bot_id

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
    
        const defaultChannel=ts.channels.modChannel
        const TESTOPTIONS=[{
            setup:async function(){
                    await clearDb();
                    await ts.db.Members.query().insert({
                        name:"banned",
                        discord_id:bot_id,
                        is_banned:1,
                    })
                },
                description:'Check !register with banned person',
                cmd:'!register',
                expected:ts.message('error.userBanned')+ts.message('error.afterUserDiscord'),
            },{
                description:'Check !points when barred',
                cmd:'!points',
                expected:ts.message('error.userBanned')+ts.message('error.afterUserDiscord'),
            },{
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
            },{
                description:'at me bot',
                cmd:'!atmebot',
                async expected(value){
                    //message is correct
                    if((bot_reply+ts.message('atme.willBe'))!=value) return false;

                    //values are correct
                    let memberEntry=await ts.db.Members.query().where({discord_id:bot_id}).first()
                    if(!memberEntry.atme) return false;

                    return true
                },
                
            },{
                description:'at me bot already',
                cmd:'!atmebot',
                async expected(value){
                    //message is correct
                    if((ts.message('atme.already')+ts.message('error.afterUserDiscord'))!=value) return false;

                    //values are correct
                    let memberEntry=await ts.db.Members.query().where({discord_id:bot_id}).first()
                    if(!memberEntry.atme) return false;

                    return true
                },
                
            },{
                description:'dont at me bot',
                cmd:'!dontatmebot',
                async expected(value){
                    //message is correct
                    if((bot_reply+ts.message('atme.willBeNot'))!=value) return false;

                    //values are correct
                    let memberEntry=await ts.db.Members.query().where({discord_id:bot_id}).first()
                    if(memberEntry.atme) return false;

                    return true
                },
                
            },{
                description:'dont at me already',
                cmd:'!dontatmebot',
                async expected(value){
                    //message is correct
                    if((ts.message('atme.alreadyNot')+ts.message('error.afterUserDiscord'))!=value) return false;

                    //values are correct
                    let memberEntry=await ts.db.Members.query().where({discord_id:bot_id}).first()
                    if(memberEntry.atme) return false;

                    return true
                }, 
            },{
                description:'!add without any arguments',
                cmd:'!add',
                expected:ts.message('error.noCode')+ts.message('error.afterUserDiscord'),
            },{
                description:'!add with invalid level code',
                cmd:'!add xxx-xxx-xx',
                expected:ts.message('error.invalidCode')+ts.message('error.afterUserDiscord'),
            },{
                description:'!add without any level name',
                cmd:'!add xxx-xxx-xxx',
                expected:ts.message('add.noName')+ts.message('error.afterUserDiscord'),
            },{
                description:'succesful level add',
                cmd:'!add xxx-xxx-xxx level name is long',
                expected:bot_reply+ts.message('add.success',{
                    level_name:'level name is long',
                    code:'XXX-XXX-XXX',
                }),
                //TODO: add actual tests for database?
            },{
                description:'adding an existing level',
                cmd:'!add xxx-xxx-xxx long',
                expected:ts.message('add.levelExisting',{
                    level:{
                        level_name:'level name is long',
                        code:'XXX-XXX-XXX',
                        creator:'mockCreator'
                    },
                })+ts.message('error.afterUserDiscord'),
            },{
                description:'!addtags, no tags given',
                cmd:'!addtag xxx-xxx-xxx',
                expected:ts.message('tags.noTags')+ts.message('error.afterUserDiscord'),
            },{
                description:'add tags one tag',
                cmd:'!addtag xxx-xxx-xxx SMW',
                expected:bot_reply+'Tags added for  "level name is long" (XXX-XXX-XXX)\n' +
                'Current tags:```\n' +
                'SMW```',
            },{
                description:'add tags multiple tag',
                cmd:'!addtag xxx-xxx-xxx Speed-Run,Yoshi Tech',
                expected:bot_reply+'Tags added for  "level name is long" (XXX-XXX-XXX)\n' +
                'Current tags:```\n' +
                'SMW\n' +
                'Speed-Run\n' +
                'Yoshi Tech```',
            },{
                description:'add tags one tag repeated',
                cmd:'!addtag xxx-xxx-xxx smw',
                expected:'No new tags added for "level name is long" by mockCreator\n' +
                'Current tags:```\n' +
                'SMW\n' +
                'Speed-Run\n' +
                'Yoshi Tech``` ',
            },{
                description:'add tags many tag some repeated',
                cmd:'!addtag xxx-xxx-xxx yoshi tech,fire-flower,smw',
                expected:bot_reply+'Tags added for  "level name is long" (XXX-XXX-XXX)\n' +
                'Current tags:```\n' +
                'SMW\n' +
                'Speed-Run\n' +
                'Yoshi Tech\n' +
                'fire-flower```',
            },{
                description:'add tags many all repeated',
                cmd:'!addtag xxx-xxx-xxx SMW,yoshi tech,smw',
                expected:'No new tags added for "level name is long" by mockCreator\n' +
                'Current tags:```\n' +
                'SMW\n' +
                'Speed-Run\n' +
                'Yoshi Tech\n' +
                'fire-flower``` ',
            },{
                description:'removetags one tags',
                cmd:'!removetag xxx-xxx-xxx smw',
                expected:bot_reply+'Tags removed for  "level name is long" (XXX-XXX-XXX)\n' +
                'Current tags:```\n' +
                'Speed-Run\n' +
                'Yoshi Tech\n' +
                'fire-flower```',
            },{
                description:'removetags on repeat',
                cmd:'!removetag xxx-xxx-xxx smw',
                expected:'No tags have been removed for "level name is long" (XXX-XXX-XXX)\n' +
                'Current Tags:```\n' +
                'Speed-Run\n' +
                'Yoshi Tech\n' +
                'fire-flower``` ',
            },{
                description:'!clear with a slightly wrong level code',
                cmd:'!clear xxx-xxx-xx',
                expected:"The code XXX-XXX-XX was not found in TeamJamp's list.Did you mean:```\n" +
                'XXX-XXX-XXX - "level name is long" by mockCreator``` ',
            },{
                description:"Can't clear own level",
                cmd:'!clear xxx-xxx-xxx',
                expected:ts.message('clear.ownLevel')+ts.message('error.afterUserDiscord'),
            },{
                description:'Change user to mockPlayer for next tests',
                cmd:'!mockuser mockPlayer1',
                expected:ts.message('mock.userSuccess',{name:'mockPlayer1'})
            },{
                description:'!points with no clear',
                cmd:'!points',
                expected:bot_reply+
                    ts.message('points.points',{
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
                description:'!clear wrong difficulty rating',
                cmd:'!clear xxx-xxx-xxx lol lol',
                expected:ts.message('clear.invalidDifficulty')+ts.message('error.afterUserDiscord'),
            },{
                description:'!clear wrong difficulty rating',
                cmd:'!clear xxx-xxx-xxx lol lol',
                expected:ts.message('clear.invalidDifficulty')+ts.message('error.afterUserDiscord'),
            },{
                description:'!clear without discord id (this is more for web api)',
                async setup(){
                    message.author.id=null
                },
                cmd:'!clear xxx-xxx-xxx',
                expected:ts.message('clear.discordId')+ts.message('error.afterUserDiscord'),
                async teardown(){
                    message.author.id=bot_id
                },
            },{
                description:'Succesful clear, level is pending',
                cmd:'!clear xxx-xxx-xxx',
                expected:bot_reply+'\n ‣You have cleared \'level name is long\'  by mockCreator \n'+
                ' ‣This level is still pending',
            },{
                description: "remove clears",
                cmd:'!removeclear xxx-xxx-xxx',
                expected:bot_reply+'\n' +
                ts.message('clear.removedClear',{levelInfo:"'level name is long'  by mockCreator"}),
            },{
                description: "Already remove clear",
                cmd:'!removeclear xxx-xxx-xxx',
                expected:bot_reply+'\n' +
                ts.message('clear.alreadyUncleared',{levelInfo:"'level name is long'  by mockCreator"}),
            },{
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
                description:'Change user to a mod for next tests',
                cmd:'!mockuser mockMod1',
                expected:ts.message('mock.userSuccess',{name:'mockMod1'})
            },{
                description:"judge a level. Channel should be deleted",
                cmd:'!judge',
                channel:"xxx-xxx-xxx",
                async expected(value){
                    const newChannel=await guild.channels.find(c => c.name === 'xxx-xxx-xxx')
                    if(newChannel) throw "channel not deleted";

                    let level=await ts.db.Levels.query().where({code:'XXX-XXX-XXX'}).first()
                    if(!level) throw "No level found";
                    if(level.status!==ts.LEVEL_STATUS.APPROVED) throw "Didn't approve";

                    return true;
                    //not sure how to test initiation and show approval stuff
                },
            },{
                description:'Change to mockplayer for next tests',
                cmd:'!mockUser mockPlayer1',
                expected:ts.message('mock.userSuccess',{name:'mockPlayer1'})
            },{
                description:'Succesful approved clear+like',
                cmd:'!clear xxx-xxx-xxx like',
                expected:[
                    bot_reply,
                    ts.message('clear.addClear',{levelInfo:"'level name is long'  by mockCreator"}),
                    ' ‣You have earned 5 points',
                    ' ‣You also have liked this level ',
                ].join('\n'),
            },{
                description:'Check points after clearing a level',
                cmd:'!points',
                expected:bot_reply+
                    ts.message('points.points',{
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
                    let reply=bot_reply
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
                    });
                    return reply==value
                }
        
            },{
                cmd:'!mockuser mockCreator',
                expected:ts.message('mock.userSuccess',{name:'mockCreator'})
            },{
                cmd:'!reupload xxx-xxx-xxx',
                expected:ts.message('reupload.invalidNewCode')+ts.message('error.afterUserDiscord'),
            },{
                cmd:'!reupload xxx-xxx-xxx xxx-xxx-xxx',
                expected:ts.message('reupload.sameCode')+ts.message('error.afterUserDiscord'),
            },{
                cmd:'!reupload xxx-xxx-xxx xxx-xxx-yy',
                expected:ts.message('reupload.invalidNewCode')+ts.message('error.afterUserDiscord'),
            },{
                cmd:'!reupload xxx-xxx-xxx xxx-xxx-yyy',
                expected:ts.message('reupload.giveReason')+ts.message('error.afterUserDiscord'),
            },{
                cmd:'!reupload xxx-xxx-xxx xxx-xxx-yyy "some reason"',
                expected:bot_reply+ts.message('reupload.success',{
                    level:{
                        level_name:'level name is long',
                        creator:'mockCreator',
                    },
                    new_code:'XXX-XXX-YYY'
                })+ts.message('reupload.inReuploadQueue')
            },{
                cmd:'!fixapprove',
                channel:"xxx-xxx-yyy",
                async expected(value){
                    //TODO: check if channel is deleted
                    return true;
                }
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
    if(typeof obj.teardown==="function"){
        await obj.teardown()
    }
    if(typeof obj.expected==="function"){
        post_result({
            description:obj.description,
            command:obj.cmd,
            value,
            expected:"function",
            result:await obj.expected(value),
        })
    } else {
        post_result({
            description:obj.description,
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
        const description=obj.description || obj.command
        console.log(`#${id} ✅: ${description}`)
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