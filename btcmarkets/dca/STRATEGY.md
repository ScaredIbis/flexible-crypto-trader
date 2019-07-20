## BTCMarkets Dollar Cost Averaging Strategy

The dca strategy periodically buys a set AUD amount of coins defined in `JSON_DATA`

### Buy Process

- For each coin specified in `JSON_DATA`
    - Place market order to purchase `AUD_PURCHASE_AMOUNT` worth of coin based on current best ask price

### Sell Process
- There is no sell process, setting `ENABLE_SELL` to 'false' disables the selling process






