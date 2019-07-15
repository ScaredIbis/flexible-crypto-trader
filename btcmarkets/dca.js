const BTCMarkets = require('btc-markets').default;
const round = require('lodash.round');

const client = new BTCMarkets(
	process.env.BTC_MARKETS_KEY,
	process.env.BTC_MARKETS_SECRET,
);

async function dca() {

	const dcaPurchaseMap = JSON.parse(process.env.DCA_PURCHASE_MAP);

	for (const tickerSymbol in dcaPurchaseMap) {
		const audToSpend = dcaPurchaseMap[tickerSymbol];
		const symbol = tickerSymbol.toUpperCase();
		try {
			const { bestAsk } = await client.getTick(symbol, 'AUD');

			const amountToBuy = round(audToSpend / bestAsk, 8);

			await client.createOrder(symbol, 'AUD', null, amountToBuy * BTCMarkets.numberConverter, 'Bid', 'Market', null);
			console.log(`DCA Purchase: ${amountToBuy} ${symbol} @ $${bestAsk} per coin ($${audToSpend})`);
		} catch (e) {
			console.log(`Failed to make DCA Purchase for $${audToSpend} of ${symbol}: ${e.message}`);
		}
	}

	let result = 'DCA process completed without errors';
	console.log(result);
	return result;
}

module.exports = dca;