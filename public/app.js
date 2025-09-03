document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Get DOM elements and check for their existence
    const cryptoGrid = document.getElementById('cryptoGrid');
    const searchInput = document.getElementById('searchInput');
    const cardTemplate = document.getElementById('crypto-card-template');
    const marketCapElement = document.getElementById('marketCap');
    const modal = document.getElementById('detailModal');
    
    // Check if required elements exist
    if (!cryptoGrid || !cardTemplate) {
        console.error('Required DOM elements not found');
        return;
    }
    
    let cryptoData = [];
    let refreshInterval;
    let isSearchActive = false;
    let chart = null;
    let selectedCoin = null;
    let selectedInterval = '1h';

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
        console.log('Creating card for:', data.symbol);
        const card = cardTemplate.content.cloneNode(true);
        const cardElement = card.querySelector('.crypto-card');
        
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

        // Add click handler for detailed view only if modal exists
        if (modal) {
            cardElement.addEventListener('click', () => showDetailedView(data));
        }
        
        return cardElement;
    };

    // Update crypto grid
    const updateCryptoGrid = (data) => {
        console.log('Updating grid with', data.length, 'cryptocurrencies');
        cryptoGrid.innerHTML = '';
        data.forEach(crypto => {
            if (crypto.symbol.endsWith('USDT')) {
                const card = createCryptoCard(crypto);
                cryptoGrid.appendChild(card);
            }
        });
    };

    // Filter cryptocurrencies
    const filterCryptos = (searchTerm) => {
        console.log('Filtering with term:', searchTerm);
        const filtered = cryptoData.filter(crypto => 
            crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()) &&
            crypto.symbol.endsWith('USDT')
        );
        updateCryptoGrid(filtered);
    };

    // Fetch crypto data from Binance public API
    const fetchCryptoData = async () => {
        console.log('Fetching crypto data...');
        try {
            const response = await fetch('https://api3.binance.com/api/v3/ticker/24hr');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Received data for', data.length, 'pairs');
            
            // Filter only USDT pairs and sort by volume
            cryptoData = data
                .filter(crypto => crypto.symbol.endsWith('USDT'))
                .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
            
            console.log('Filtered to', cryptoData.length, 'USDT pairs');
            
            // Update the grid with the filtered data
            updateCryptoGrid(cryptoData);

            // Update market stats if elements exist
            if (marketCapElement) {
                const totalVolume = cryptoData
                    .reduce((acc, curr) => acc + parseFloat(curr.quoteVolume), 0);
                
                const volumeElement = document.getElementById('volume');
                if (volumeElement) {
                    volumeElement.textContent = `$${formatNumber(totalVolume)}`;
                }
                
                // Update market cap
                const marketCap = calculateMarketCap(cryptoData);
                marketCapElement.textContent = `$${formatNumber(marketCap)}`;
            }
            
        } catch (error) {
            console.error('Error fetching crypto data:', error);
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Failed to fetch crypto data. Please try again later.';
            cryptoGrid.innerHTML = '';
            cryptoGrid.appendChild(errorMsg);
        }
    };

    // Manage auto-refresh
    const startAutoRefresh = () => {
        stopAutoRefresh();
        refreshInterval = setInterval(fetchCryptoData, 10000);
    };

    const stopAutoRefresh = () => {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    };

    // Show detailed view
    const showDetailedView = (data) => {
        selectedCoin = data;
        const symbol = data.symbol.replace('USDT', '');
        
        // Update modal title and details
        modal.querySelector('.coin-title').textContent = `${symbol}/USDT`;
        document.getElementById('detailPrice').textContent = `$${formatPrice(data.lastPrice)}`;
        
        const changeElement = document.getElementById('detailChange');
        const changePercent = parseFloat(data.priceChangePercent);
        changeElement.textContent = `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
        changeElement.className = changePercent >= 0 ? 'positive' : 'negative';
        
        document.getElementById('detailHigh').textContent = `$${formatPrice(data.highPrice)}`;
        document.getElementById('detailLow').textContent = `$${formatPrice(data.lowPrice)}`;
        document.getElementById('detailVolume').textContent = formatNumber(data.volume);
        document.getElementById('detailQuoteVolume').textContent = `$${formatNumber(data.quoteVolume)}`;
        
        // Initialize or update chart
        initChart();
        fetchKlines();
        
        // Show modal
        modal.style.display = 'block';
        stopAutoRefresh();
    };

    // Initialize chart
    const initChart = () => {
        const chartContainer = document.getElementById('priceChart');
        if (!chartContainer) {
            console.error('Chart container not found');
            return null;
        }

        if (chart) {
            chart.remove();
        }

        const chartOptions = {
            width: chartContainer.clientWidth,
            height: 400,
            layout: {
                background: { type: 'solid', color: 'rgba(0, 0, 0, 0.5)' },
                textColor: '#FFFFFF',
            },
            grid: {
                vertLines: { color: 'rgba(123, 43, 249, 0.2)' },
                horzLines: { color: 'rgba(123, 43, 249, 0.2)' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#7B2BF9',
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
                vertLine: {
                    color: '#7B2BF9',
                    width: 1,
                    style: 1,
                    labelBackgroundColor: '#7B2BF9',
                },
                horzLine: {
                    color: '#7B2BF9',
                    width: 1,
                    style: 1,
                    labelBackgroundColor: '#7B2BF9',
                },
            },
            rightPriceScale: {
                borderColor: '#7B2BF9',
            },
        };

        try {
            chart = LightweightCharts.createChart(chartContainer, chartOptions);
            return chart.addCandlestickSeries({
                upColor: '#26a69a',
                downColor: '#ef5350',
                borderVisible: false,
                wickUpColor: '#26a69a',
                wickDownColor: '#ef5350',
            });
        } catch (error) {
            console.error('Error creating chart:', error);
            return null;
        }
    };

    // Fetch kline (candlestick) data
    const fetchKlines = async () => {
        if (!selectedCoin) {
            console.error('No coin selected');
            return;
        }

        const intervals = {
            '1h': '1h',
            '4h': '4h',
            '1d': '1d',
            '1w': '1w'
        };

        const limit = 1000;
        const interval = intervals[selectedInterval];
        
        try {
            const response = await fetch(
                `https://api3.binance.com/api/v3/klines?symbol=${selectedCoin.symbol}&interval=${interval}&limit=${limit}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            const candleData = data.map(d => ({
                time: d[0] / 1000,
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4])
            }));

            const series = initChart();
            if (series) {
                series.setData(candleData);
                chart.timeScale().fitContent();
            }
        } catch (error) {
            console.error('Error fetching kline data:', error);
        }
    };

    // Initialize modal functionality if modal exists
    if (modal) {
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                if (!isSearchActive) {
                    startAutoRefresh();
                }
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                if (!isSearchActive) {
                    startAutoRefresh();
                }
            }
        });

        // Time interval buttons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                selectedInterval = e.target.dataset.interval;
                if (typeof fetchKlines === 'function') {
                    fetchKlines();
                }
            });
        });
    }

    // Add search functionality if search input exists
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            isSearchActive = searchTerm.length > 0;
            
            if (isSearchActive) {
                stopAutoRefresh();
                const marketPulse = document.querySelector('.market-pulse');
                if (marketPulse) {
                    marketPulse.classList.add('paused');
                }
            } else {
                startAutoRefresh();
                const marketPulse = document.querySelector('.market-pulse');
                if (marketPulse) {
                    marketPulse.classList.remove('paused');
                }
            }
            
            filterCryptos(searchTerm);
        });
    }

    // Calculate total market cap
    const calculateMarketCap = (data) => {
        const topCoins = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 
                         'DOGEUSDT', 'DOTUSDT', 'UNIUSDT', 'LTCUSDT', 'LINKUSDT'];
        
        return data
            .filter(crypto => topCoins.includes(crypto.symbol))
            .reduce((total, crypto) => {
                const price = parseFloat(crypto.lastPrice);
                let circulation;
                switch(crypto.symbol) {
                    case 'BTCUSDT': circulation = 19_000_000; break;
                    case 'ETHUSDT': circulation = 120_000_000; break;
                    case 'BNBUSDT': circulation = 153_856_150; break;
                    case 'XRPUSDT': circulation = 45_404_028_640; break;
                    case 'ADAUSDT': circulation = 35_000_000_000; break;
                    default: circulation = 0;
                }
                return total + (price * circulation);
            }, 0);
    };

    // Initial fetch and start auto-refresh
    console.log('Starting initial fetch...');
    fetchCryptoData();
    startAutoRefresh();

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
