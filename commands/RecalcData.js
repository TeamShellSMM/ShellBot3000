const TSCommand = require('../TSCommand.js');
const config = require('../config.json');

class RecalcData extends TSCommand {
    constructor() {
        super('recalc', {
            aliases: ['recalc'],
            channelRestriction: 'guild'
        });
    }

    async canRun(ts,message){
        if(config.ownerID && config.ownerID.indexOf(message.author.id)!==-1){
            return true;
        }
        if(config.devs && config.devs.indexOf(message.author.id)!==-1){
            return true;
        }

        if(ts.is_mod({discord_id:message.author.id})){
            return true
        }

        return false;
    }


    async tsexec(ts,message, args){

        //await ts.recalc()
        /*
        benchmarks
        console.time('recalc')
        await ts.recalculateAfterUpdate()
        console.timeEnd('recalc')
        console.time('liaf')
        await ts.recalculateAfterUpdate({name: 'Liaf'})
        console.timeEnd('liaf')
        console.time('a_unique_id')
        await ts.recalculateAfterUpdate({name:'a_unique_id'})
        console.timeEnd('a_unique_id')
        console.time('codeCalc')
        await ts.recalculateAfterUpdate({code:'GBW-GFP-G2G'})
        console.timeEnd('codeCalc')
        console.time('codeCalc2')
        await ts.recalculateAfterUpdate({code:'X56-MM6-P8G'})
        console.timeEnd('codeCalc2')
        */
        await ts.recalculateAfterUpdate()
        return message.reply(`Recalculated data!`);
    }
}

module.exports = RecalcData;