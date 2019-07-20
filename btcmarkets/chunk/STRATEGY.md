## Chunk Strategy

The chunk strategy runs parallel trading chunks that are bought and sold independently of eachother. ```AUD_PURCHASE_AMOUNT``` and ```MAX_AUD_IN_OPEN_TRADES``` determine how many of these chunks can be running at any give time.

### Buy Process

- Get all unsold chunks from DynamoDB
- If total AUD value of unsold chunks + `AUD_PURCHASE_AMOUNT` exceeds `MAX_AUD_IN_OPEN_TRADES`
    - Abort buy process
- If it hasn't been too long since last buy (`MAX_MINUTES_BETWEEN_TRADES`) and there is enough AUD currently in play (`MIN_AUD_IN_OPEN_TRADES`)
    - Abort buy process
        - This ensures the trader swiftly replenishes chunks when price rises sharply and chunks are being sold quickly.
- If `AUD_PURCHASE_AMOUNT` exceeds `MAX_AUD_IN_OPEN_TRADES`
    - Abort buy process
- Get the current best asking price from BTCMarkets for given `COIN`
- If running in live mode (`LIVE` is set to 'true')
    - Place market order to purchase `AUD_PURCHASE_AMOUNT` worth of `COIN` based on best ask price
- Store chunk details in dynamoDB (as per `DB_TABLE_NAME`)

### Sell Process
- Get all unsold chunks from DynamoDB
- If there are no unsold chunks
    - Abort sell process
- For each unsold chunk
    - If the current best bidding price is not a gain of at least `MIN_PERCENTAGE_GAIN` on the purchase price
        - Skip to next unsold chunk
    - If running in accumulate mode (`MODE` is set to 'ACCUMULATE')
        - Calculate amount to sell such that spent AUD amount is regained and leftover amount of `COIN` is kept as profit
    - If not running in accumulate mode (`MODE` is not set or is equal to 'TRADE')
        - Amount to sell is simply the amount purchased, `AUD` gain is kept as profit
    - If running in live mode (`LIVE` is set to 'true')
        - Place market order to sell the determined amount of `COIN`
    - Mark chunk and sold and store sale details in DynamoDB






