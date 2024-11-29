const express = require('express');
const cors = require('cors');
const { Spot } = require('@binance/connector');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const client = new Spot();

app.get('/api/prices', async (req, res) => {
    try {
        const tickerResponse = await client.tickerPrice();
        res.json(tickerResponse.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/24hr', async (req, res) => {
    try {
        const [stats, prices] = await Promise.all([
            client.ticker24hr(),
            client.tickerPrice()
        ]);
        
        // Create a map of current prices
        const priceMap = new Map(
            prices.data.map(item => [item.symbol, item.price])
        );
        
        // Combine stats with current prices
        const combinedData = stats.data.map(stat => ({
            ...stat,
            currentPrice: priceMap.get(stat.symbol) || '0'
        }));
        
        res.json(combinedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
