'use strict';

const buy = require('./buy');
const sell = require('./sell');
const dca = require('./dca');

module.exports.buy = async () => {
	try {
		const result = await buy();
		console.log(`Successful Buy Execution: ${result}`);
		return {
			message: `Successful Buy Execution: ${result}`
		};
	} catch (e) {
		console.log(`Unsuccessful Buy Execution: ${e.message}`);
		return {
			message: `Unsuccessful Buy Execution: ${e.message}`
		};
	}
};

module.exports.sell = async () => {
	try {
		const result = await sell();
		console.log(`Successful Sell Execution: ${result}`);
		return {
			message: `Successful Sell Execution: ${result}`
		};
	} catch (e) {
		console.log(`Unsuccessful Sell Execution: ${e.message}`);
		return {
			message: `Unsuccessful Sell Execution: ${e.message}`
		};
	}
};

module.exports.dca = async () => {
	try {
		const result = await dca();
		console.log(`Successful DCA Execution: ${result}`);
		return {
			message: `Successful DCA Execution: ${result}`
		};
	} catch (e) {
		console.log(`Unsuccessful DCA Execution: ${e.message}`);
		return {
			message: `Unsuccessful DCA Execution: ${e.message}`
		};
	}
};
