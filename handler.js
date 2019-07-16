const { EXCHANGE, STRATEGY } = process.env;

if(!EXCHANGE) {
	throw new Error('"EXCHANGE" env variable is required');
}

if(!STRATEGY) {
	throw new Error('"STRATEGY" env variable is required');
}

const buyHandlerPath = `./${EXCHANGE}/${STRATEGY}/buy`;
const sellHandlerPath = `./${EXCHANGE}/${STRATEGY}/sell`;

module.exports.buy = async () => {
	try {
		if(process.env.ENABLE_BUY === 'true') {
			const buy = require(buyHandlerPath);
			const result = await buy();
			console.log(`Successful Buy Execution: ${result}`);
			return {
				message: `Successful Buy Execution: ${result}`
			};
		}
	} catch (e) {
		console.log(`Unsuccessful Buy Execution: ${e.message}`);
		return {
			message: `Unsuccessful Buy Execution: ${e.message}`
		};
	}
};

module.exports.sell = async () => {
	try {
		if(process.env.ENABLE_SELL === 'true') {
			const sell = require(sellHandlerPath);
			const result = await sell();
			console.log(`Successful Sell Execution: ${result}`);
			return {
				message: `Successful Sell Execution: ${result}`
			};
		}
	} catch (e) {
		console.log(`Unsuccessful Sell Execution: ${e.message}`);
		return {
			message: `Unsuccessful Sell Execution: ${e.message}`
		};
	}
};