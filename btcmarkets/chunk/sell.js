const BTCMarkets = require('btc-markets').default;
const AWS = require('aws-sdk');

const round = require('lodash.round');

const client = new BTCMarkets(
	process.env.BTC_MARKETS_KEY,
	process.env.BTC_MARKETS_SECRET,
);

async function sell() {
	const coin = process.env.COIN;
	const minPercentageGain = Number(process.env.MIN_PERCENTAGE_GAIN);
	const tableName = process.env.DB_TABLE_NAME;

	const db = new AWS.DynamoDB.DocumentClient({
		apiVersion: '2012-08-10'
	});

	const openTrades = await new Promise((resolve, reject) => {
		db.scan({
			TableName: tableName,
			FilterExpression: 'attribute_not_exists(sale) or sale = :null',
			ExpressionAttributeValues: {
				':null': null
			}
		}, async (err, data) => {
			if(err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});

	if(!openTrades.Items.length) {
		let result = 'SELL PROCESS: NO OPEN TRADES, ENDING SELL PROCESS';
		console.log(result);
		return result;
	}

	for(const trade of openTrades.Items) {
		console.log('------------------------------------------------');
		console.log(`CHECKING GAINS FOR TRADE ${trade.id}`);
		const { bestBid } = await client.getTick(coin, 'AUD');
		const percentageGain = (bestBid - trade.coinPrice) / trade.coinPrice * 100;
		console.log('----------------------------------------------');
		console.log(`BOUGHT AT ${trade.coinPrice} AND CAN SELL FOR ${bestBid}.`);
		console.log(`THIS IS A ${percentageGain}% GAIN`);
		if(percentageGain < minPercentageGain) {
			console.log(`NOT GOOD ENOUGH GAINS, NEED AT LEAST ${minPercentageGain}%`);
			console.log('----------------------------------------------');
		} else {
			console.log('THAT\'S A GOOD ENOUGH GAIN, PLACING SELL ORDER');
			console.log('----------------------------------------------');
			let order = {
				id: 'SIMULATED_ORDER'
			};

			const sale = {
				order,
				coinPrice: bestBid,
				soldAt: new Date().toISOString(),
				percentageGain: percentageGain,
				coinGain: null,
				audGain: (trade.amountSpentAUD * (1 + (percentageGain / 100))) - trade.amountSpentAUD,
				mode: process.env.MODE
			};

			let amountToSell = trade.amountPurchased;

			if(process.env.MODE === 'ACCUMULATE') {
				// if accumulating, only sell enough to get your aud back
				// keep the rest of your precious coins
				amountToSell = round(trade.amountSpentAUD / bestBid, 8);
				sale.coinGain = trade.amountPurchased - amountToSell;
			}

			if(process.env.LIVE === 'true') {
				const order = await client.createOrder(coin, 'AUD', null, amountToSell * BTCMarkets.numberConverter, 'Ask', 'Market', null);
				sale.order = order;
				try {
					const orderDetails = await client.getOrderDetail([sale.order.id]);
					const actualCoinPrice = orderDetails.orders[0].trades[0].price / BTCMarkets.numberConverter;
					const actualPercentageGain = (sale.coinPrice - trade.coinPrice) / trade.coinPrice * 100;
					const actualAudGain = (trade.amountSpentAUD * (1 + (sale.percentageGain / 100))) - trade.amountSpentAUD;
					sale.coinPrice = actualCoinPrice;
					sale.percentageGain = actualPercentageGain;
					sale.audGain = actualAudGain;
				} catch (e) {
					console.log('ERROR FILLING ACCURATE SALE DATA:', e.message);
				}
			}
			await new Promise((resolve, reject) => {
				db.update({
					TableName: tableName,
					Key: { id : trade.id },
					UpdateExpression: 'set #sale = :sale',
					ExpressionAttributeNames: {'#sale' : 'sale'},
					ExpressionAttributeValues: {
						':sale' : sale
					}
				}, (err, data) => {
					if(err) {
						reject(err);
					} else {
						resolve(data);
					}
				});
			});
		}
	}

	let result = 'Sell process completed without errors';
	console.log(result);
	return result;
}

module.exports = sell;