var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
global.fetch = require('node-fetch')
const cc = require('cryptocompare')
const get = require('simple-get')
var dateFormat = require('dateformat');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.discordKey,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

function getPrice(coin) {
	var price = cc.price(coin,'USD')
	.then(prices => {
		return prices.USD
	})
}

bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'pong!'
                });
            break;

            case 'price':
                var coin = args[0];

                var price = cc.priceFull(coin,'USD')
                .then(prices => {
                  var coinPrice = prices.USD
                  logger.info(coinPrice)
                   var newMessage = '```==============  ' + coin + ' ============= \n'
                   newMessage +=  'Price: ' + prices.price + ' ( ' + prices.CHANGEPCT24HOUR + ' )' + '\n'
                   newMessage +=  'Volume: ' + prices.VOLUME24HOUR + '\n'
                   newMessage +=  'MarketCap: ' + prices.MKTCAP + '\n'
                   newMessage +=  '```'
                   bot.sendMessage({
                       to: channelID,
                       message: newMessage
                   });
                })
            break;
			
			case 'payments':
			
				var opts = {
				  method: 'GET',
				  url: 'https://api.nanopool.org/v1/etn/paymentsday/'+auth.etnWallet,
				  json: true
				}
				var etnPrice = getPrice('ETN');
				logger.info('etnPrice1 = ' + etnPrice);
				
				get.concat(opts, function (err, res, data) {
				   if (err) throw err
				   var newMessage = '```==============  Payments in the last 24 Hours ============= \n'
				   var payments = data.data
				   var totalIn24 = 0
				   for(var payment in payments) {
			  	      var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
				      d.setUTCSeconds(payments[payment].date);
					  newMessage += '[' + d.toLocaleString("en-US") + '] ' + payments[payment].amount.toFixed(2)
					  newMessage += '\n'
					  totalIn24 += payments[payment].amount;
				   } 
				   var etnPrice = getPrice('ETN');
				   logger.info('etnPrice2 = ' + etnPrice);
				   perHour = totalIn24/24;
				   totalUSD = totalIn24 * etnPrice;
				   logger.info('etnPrice = ' + etnPrice);
				   logger.info('totalUSD = ' + totalUSD);
				   totalUSDperHour = perHour * etnPrice;
				   logger.info('totalUSDperHour = ' + totalUSDperHour);
				   newMessage += 'Total: ' + totalIn24.toFixed(2) + ' ETN - ( $' + totalUSD + 'USD )\n'
				   newMessage += 'Per Hour: ' + perHour.toFixed(2) + ' ETN - ( $' + totalUSDperHour + 'USD )\n'
				   newMessage += '```'
				  
				   bot.sendMessage({
                      to: channelID,
                      message: newMessage
                   });
				})
			break;
			
			case 'miners':
	         var hashRatesURL = 'http://'+auth.apiURL+'/api/miners?key='+auth.apiKey;
				var opts = {
				  method: 'GET',
				  url: hashRatesURL,
				  json: true
				}

            var infoRequest = args[0];

            switch(infoRequest){
               case 'hash' :
                  get.concat(opts, function (err, res, data) {
                     if (err) throw err
                     var newMessage = '```==============  Hashrates ============= \n'
                     var groups = data.groupList
                     var totalHash = data.totalHashrate5s
                     
                     for(var group in groups) {
                        newMessage += '-' + groups[group].name + '-\n'
                        var miners = groups[group].minerList;
                        for(var miner in miners) {
                           newMessage += '   [' + miners[miner].name + '] ' + miners[miner].speedInfo.hashrate + '\n'
                        } 
                     }
					 newMessage += '   Total Hashrate:' +  data.totalHashrate5s + '\n'

                     newMessage += '```'
                    
                     bot.sendMessage({
                            to: channelID,
                            message: newMessage
                         });
                  })
               break;

               case 'temp' :
                  get.concat(opts, function (err, res, data) {
                     if (err) throw err
                     var newMessage = '```==============  GPU Temps ============= \n'
                     var groups = data.groupList
                     var totalHash = data.totalHashrates5s
                     
                     for(var group in groups) {
                        newMessage += '-' + groups[group].name + '-\n'
                        var miners = groups[group].minerList;
                        for(var miner in miners) {
                           newMessage += '   [' + miners[miner].name + ']\n'
                           var gpus = miners[miner].gpuList;
                           for(var gpu in gpus){
                              newMessage += '      '+gpus[gpu].name.split(':')[0]+': ' + gpus[gpu].deviceInfo.temperature + 'c';
                              newMessage += ' (fan ' + gpus[gpu].deviceInfo.fanPercent + '%)\n'
                           }
                        } 
                     }

                     newMessage += '```'
                    
                     bot.sendMessage({
                            to: channelID,
                            message: newMessage
                         });
                  })
               break;
            }
				

			break;
			break;

            // Just add any case commands if you want to..
         }
     }
});
