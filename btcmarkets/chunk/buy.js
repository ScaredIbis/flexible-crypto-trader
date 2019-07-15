const BTCMarkets = require('btc-markets').default;
const round = require('lodash.round');
const uuid = require('uuid/v4');
const differenceInMinutes = require('date-fns/difference_in_minutes');

const AWS = require('aws-sdk');

const client = new BTCMarkets(
	process.env.BTC_MARKETS_KEY,
	process.env.BTC_MARKETS_SECRET,
);

async function buy() {
	const coin = process.env.COIN.toUpperCase();
	const tableName = process.env.DB_TABLE_NAME;

	const amountToSpendAUD = Number(process.env.AUD_PURCHASE_AMOUNT);
	const maxAudInOpenTrades = Number(process.env.MAX_AUD_IN_OPEN_TRADES);
	const minAudInOpenTrades = Number(process.env.MIN_AUD_IN_OPEN_TRADES);
	const maxMinsBetweenTrades = Number(process.env.MAX_MINUTES_BETWEEN_TRADES);

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

	if(openTrades.Items.length) {
		const amountSpentAUDInOpenTrades = openTrades.Items.reduce((total, item) => {
			return total+item.amountSpentAUD;
		}, 0);

		if(amountSpentAUDInOpenTrades + amountToSpendAUD > maxAudInOpenTrades) {
			let result = `Already hit max aud in open trades (${maxAudInOpenTrades}), skipping buy process`;
			console.log('BUY RESULT: ', result);
			return result;
		}

		const descendingByPurchasedAt = openTrades.Items.sort((a, b) => {
			return new Date(b.purchasedAt).valueOf() - new Date(a.purchasedAt).valueOf();
		});
		const latestTrade = descendingByPurchasedAt[0];

		const minsSinceLastTrade = differenceInMinutes(new Date(), new Date(latestTrade.purchasedAt));

		const longEnoughSinceLastTrade = minsSinceLastTrade >= maxMinsBetweenTrades;
		const enoughAUDInPlay = amountSpentAUDInOpenTrades >= minAudInOpenTrades;

		if(longEnoughSinceLastTrade) {
			console.log(`LONG ENOUGH SINCE LAST TRADE (${minsSinceLastTrade} mins) - max ${maxMinsBetweenTrades} mins`);
		} else {
			console.log(`NOT LONG ENOUGH SINCE LAST TRADE (${minsSinceLastTrade} mins) - max ${maxMinsBetweenTrades} mins`);
		}

		if(enoughAUDInPlay) {
			console.log(`ENOUGH AUD IN OPEN TRADES ($${amountSpentAUDInOpenTrades}) - min $${minAudInOpenTrades}`);
		} else {
			console.log(`NOT ENOUGH AUD IN OPEN TRADES ($${amountSpentAUDInOpenTrades}) - min $${minAudInOpenTrades}`);
		}

		if(!longEnoughSinceLastTrade && enoughAUDInPlay) {
			return 'BUY RESULT: NOT LONG ENOUGH BETWEEN TRADES AND ACCEPTABLE AMOUNT OF AUD IN PLAY';
		}
	}


	if(amountToSpendAUD > maxAudInOpenTrades) {
		let result = `Amount to spend (${amountToSpendAUD}) is higher than max allowed spend ${maxAudInOpenTrades}, skipping buy`;
		console.log('BUY RESULT: ', result);
		return result;
	}

	// we are a small fry so assume for now that the best ask will fulfil our order
	const { bestAsk } = await client.getTick(coin, 'AUD');

	const amountToBuy = round(amountToSpendAUD / bestAsk, 8);

	let order = {
		id: 'SIMULATED_ORDER'
	};

	if(process.env.LIVE === 'true') {
		order = await client.createOrder(coin, 'AUD', null, amountToBuy * BTCMarkets.numberConverter, 'Bid', 'Market', null);
	}

	await new Promise((resolve, reject) => {
		db.put({
			TableName : tableName,
			Item: {
				order,
				id: uuid(),
				purchasedAt: new Date().toISOString(),
				amountSpentAUD: amountToSpendAUD,
				amountPurchased: amountToBuy,
				coinPrice: bestAsk,
				sale: null
			}
		}, (err, data) => {
			if(err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});


	let result = `Purchased ${amountToBuy} ${coin} @ ${bestAsk} per coin ($${amountToSpendAUD} AUD)`;
	console.log('BUY RESULT: ', result);
	return result;
}

module.exports = buy;