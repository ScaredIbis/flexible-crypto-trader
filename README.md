## Flexible Crypto Trader
Easily automate the buying and selling of digital assets.

### Prerequisites
You should be familiar with node js, aws and [serverless](https://serverless.com/) in order to use this properly.

### What it is
Flexible Crypto Trader is built on [serverless](https://serverless.com/) and makes it easy to implement and deploy strategies for buying and selling cryptocurrencies on any exchange that has an api.

### How to use it
You should have already set up an account with your chosen crypto exchange and gotten some api credentials. Once you have these, you will be able to easily write your own buying and selling logic. You can use environment variables to configure parameters like your purchase size and frequency. Once you have your desired configuration set up, you can deploy to aws with one command.

### Deploying
Use the serverless deploy command to deploy your configuration. The application will be deployed to ap-southeast-2 under your [default] aws profile by default. You can overwrite these through cli arguments.

eg. npx serverless deploy --stage btcmarkets-chunk-btc --region us-west-1 --aws-profile some-other-profile

### Adding exchanges and strategies
You can add support for additional exchanges and strategies by adhering to the folder structure for the serverless handler methods.

```
├── handler.js
├── serverless.yml
├── <exchange>
│   ├── <strategy>
│   │   ├── buy.js
│   │   ├── sell.js

```
'chunk' and 'dca' strategies are implemented for the Australian exchange [btcmarkets](https://btcmarkets.net/). The folder structure is as follows:

```
├── handler.js
├── serverless.yml
├── btcmarkets
│   ├── chunk
│   │   ├── buy.js
│   │   ├── sell.js
│   ├── dca
│   │   ├── buy.js
```
Note that the dollar cost average strategy doesn't have a sell function, this is paired with the env variable 'ENABLE_SELL' having the value 'false'

The buy and sell functions live inside the \<strategy> folder, they receive no arguments and as such should rely on environment variables for 'parameters'.

### Serverless stages

Serverless stages allow multiple configurations to be deployed at the same time.
You can use stages to run different combinations of exchanges/strategies/coins/parameters.
Stage names are passed to serverless cli during deployment and must match a configuration defined in env.yml

### Environment variables

environment variables are set in env.yml.
The existing environment variable names are tailored for the included chunk trading strategy. You should be able to adapt them to new strategies.

| Key                        | Description                                                                               |
| ---------------------------|-------------------------------------------------------------------------------------------|
| EXCHANGE                   | Name of exchange, must match folder name in project structure                             |
| STRATEGY                   | Name of strategy, must match folder name in project strucure                              |
| COIN                       | Coin ticker symbol (BTC, ETH,...)                                                         |
| LIVE                       | Will place real orders if set to true, will only log activity to dyanmoDB otherwise       |
| BTC_MARKETS_KEY            | btcmarkets api key                                                                        |
| BTC_MARKETS_SECRET         | btcmarkets secret key                                                                     |
| AUD_PURCHASE_AMOUNT        | AUD value to spend during each buy process                                                |
| MIN_PERCENTAGE_GAIN        | Minimum % gain before a sell order is placed                                              |
| MAX_AUD_IN_OPEN_TRADES     | Max AUD amount to have in play, buy process will exit early if this amount is reached     |
| MIN_AUD_IN_OPEN_TRADES     | Min AUD amount to have in play, will buy on every buy process to meet this quota          |
| MAX_MINUTES_BETWEEN_TRADES | Number of minutes to wait between buy orders when MIN_AUD_IN_OPEN_TRADES is satisfied     |
| BUY_CRON_SCHEDULE          | CRON schedule for running the buy function                                                |
| SELL_CRON_SCHEDULE         | CRON schedule for running the sell function                                               |
| ENABLE_BUY                 | if set to true, will enable the cron schedule for the buy function                        |
| ENABLE_SELL                | if set to true, will enable the cron schedule for the sell function                       |
| MODE                       | 'TRADE' to sell for AUD profits, 'ACCUMULATE' to break even on AUD and keep leftover coins|
| DB_TABLE_NAME              | DynamoDB table name, this table will be created during deployment                         |
| TABLE_THROUGHPUT           | DynamoDB table read and write throughput, set to 5 for a safe bet                         |
| JSON_DATA                  | JSON string of any arbitrary data you want                                                |

## Example environments

See exampleEnvs.yml for example environment variable configurations.

[Read This](http://www.goingserverless.com/blog/keeping-secrets-out-of-git)
for a detailed explanations of environment variables per stage.

## Known issues

- Disabled cloudwatch schedules (cron schedules) will appear to be enabled from the Lambda console.
This is a [known issue](https://github.com/serverless/serverless/issues/5111).
Running serverless package will build the cloudformation template without deploying to aws.
You can verify that the http event(s) have status 'DISABLED' in the output of this command.

## License
This project is [MIT licensed](https://github.com/scaredibis/flexible-crypto-trader/blob/master/LICENSE)
