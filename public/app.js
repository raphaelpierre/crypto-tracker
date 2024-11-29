document.addEventListener('DOMContentLoaded', () => {
    const cryptoGrid = document.getElementById('cryptoGrid');
    const searchInput = document.getElementById('searchInput');
    const cardTemplate = document.getElementById('crypto-card-template');
    const marketCapElement = document.getElementById('marketCap');
    
    let cryptoData = [];

    // Format number to compact notation
    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: 2
        }).format(num);
    };

    // Format price based on value
    const formatPrice = (price) => {
        const numPrice = parseFloat(price);
        if (numPrice < 1) {
            return numPrice.toFixed(6);
        }
        return numPrice.toFixed(2);
    };

    // Create crypto card
    const createCryptoCard = (data) => {
        const card = cardTemplate.content.cloneNode(true);
        
        // Remove USDT from symbol display
        const symbol = data.symbol.replace('USDT', '');
        card.querySelector('.symbol').textContent = symbol;
        
        // Use lastPrice for current price
        card.querySelector('.price').textContent = `$${formatPrice(data.lastPrice)}`;
        
        const changePercent = parseFloat(data.priceChangePercent);
        const changeElement = card.querySelector('.change');
        changeElement.textContent = `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
        changeElement.classList.add(changePercent >= 0 ? 'positive' : 'negative');
        
        card.querySelector('.volume span').textContent = formatNumber(data.quoteVolume);
        card.querySelector('.high span').textContent = `$${formatPrice(data.highPrice)}`;
        card.querySelector('.low span').textContent = `$${formatPrice(data.lowPrice)}`;
        
        return card;
    };

    // Update crypto grid
    const updateCryptoGrid = (data) => {
        cryptoGrid.innerHTML = '';
        data.forEach(crypto => {
            if (crypto.symbol.endsWith('USDT')) {
                cryptoGrid.appendChild(createCryptoCard(crypto));
            }
        });
    };

    // Filter cryptocurrencies
    const filterCryptos = (searchTerm) => {
        const filtered = cryptoData.filter(crypto => 
            crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()) &&
            crypto.symbol.endsWith('USDT')
        );
        updateCryptoGrid(filtered);
    };

    // Search input handler
    searchInput.addEventListener('input', (e) => {
        filterCryptos(e.target.value);
    });

    // Calculate total market cap
    const calculateMarketCap = (data) => {
        const topCoins = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 
                         'DOGEUSDT', 'DOTUSDT', 'UNIUSDT', 'LTCUSDT', 'LINKUSDT'];
        
        const marketCap = data
            .filter(crypto => topCoins.includes(crypto.symbol))
            .reduce((total, crypto) => {
                const price = parseFloat(crypto.lastPrice);
                // Estimated circulation based on typical market share
                let circulation;
                switch(crypto.symbol) {
                    case 'BTCUSDT':
                        circulation = 19_000_000; // Approximate BTC circulation
                        break;
                    case 'ETHUSDT':
                        circulation = 120_000_000; // Approximate ETH circulation
                        break;
                    case 'BNBUSDT':
                        circulation = 153_856_150; // Approximate BNB circulation
                        break;
                    case 'XRPUSDT':
                        circulation = 45_404_028_640; // Approximate XRP circulation
                        break;
                    case 'ADAUSDT':
                        circulation = 35_000_000_000; // Approximate ADA circulation
                        break;
                    default:
                        circulation = 0;
                }
                return total + (price * circulation);
            }, 0);

        return marketCap;
    };

    // Fetch crypto data from Binance public API
    const fetchCryptoData = async () => {
        try {
            // Using api3.binance.com which has CORS enabled
            const response = await fetch('https://api3.binance.com/api/v3/ticker/24hr');
            cryptoData = await response.json();
            
            // Filter only USDT pairs and sort by volume
            cryptoData = cryptoData
                .filter(crypto => crypto.symbol.endsWith('USDT'))
                .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
            
            filterCryptos('');

            // Update market stats
            const totalVolume = cryptoData
                .reduce((acc, curr) => acc + parseFloat(curr.quoteVolume), 0);
            
            document.getElementById('volume').textContent = `$${formatNumber(totalVolume)}`;
            
            // Update market cap
            const marketCap = calculateMarketCap(cryptoData);
            marketCapElement.textContent = `$${formatNumber(marketCap)}`;
            
        } catch (error) {
            console.error('Error fetching crypto data:', error);
            // Display error message on the page
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Failed to fetch crypto data. Please try again later.';
            cryptoGrid.innerHTML = '';
            cryptoGrid.appendChild(errorMsg);
        }
    };

    // Initial fetch and set up auto-refresh
    fetchCryptoData();
    setInterval(fetchCryptoData, 10000);

    // Add glitch effect on hover
    cryptoGrid.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.crypto-card');
        if (card) {
            card.style.transform = 'scale(1.02)';
            setTimeout(() => {
                card.style.transform = 'scale(1)';
            }, 100);
        }
    });
});
