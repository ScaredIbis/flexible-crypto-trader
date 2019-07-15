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
		try {
			const { bestAsk } = await client.getTick(tickerSymbol.toUpperCase(), 'AUD');

			const amountToBuy = round(audToSpend / bestAsk, 8);

			await client.createOrder(tickerSymbol, 'AUD', null, amountToBuy * BTCMarkets.numberConverter, 'Bid', 'Market', null);
			console.log(`DCA Purchase: ${amountToBuy} ${tickerSymbol} @ $${bestAsk} per coin ($${audToSpend})`);
		} catch (e) {
			console.log(`Failed to make DCA Purchase for $${audToSpend} of ${tickerSymbol}: ${e.message}`);
		}
	}
}

module.exports = dca;