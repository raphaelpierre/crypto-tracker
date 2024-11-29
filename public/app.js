document.addEventListener('DOMContentLoaded', () => {
    const cryptoGrid = document.getElementById('cryptoGrid');
    const searchInput = document.getElementById('searchInput');
    const cardTemplate = document.getElementById('crypto-card-template');
    
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
        
        card.querySelector('.symbol').textContent = data.symbol;
        card.querySelector('.price').textContent = `$${formatPrice(data.currentPrice)}`;
        
        const changePercent = parseFloat(data.priceChangePercent);
        const changeElement = card.querySelector('.change');
        changeElement.textContent = `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
        changeElement.classList.add(changePercent >= 0 ? 'positive' : 'negative');
        
        card.querySelector('.volume span').textContent = formatNumber(data.volume);
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

    // Fetch crypto data
    const fetchCryptoData = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/24hr');
            cryptoData = await response.json();
            filterCryptos('');

            // Update market stats
            const totalVolume = cryptoData
                .filter(crypto => crypto.symbol.endsWith('USDT'))
                .reduce((acc, curr) => acc + parseFloat(curr.volume), 0);
            
            document.getElementById('volume').textContent = `$${formatNumber(totalVolume)}`;
            
        } catch (error) {
            console.error('Error fetching crypto data:', error);
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
