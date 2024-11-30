// DOM Elements
const walletModal = document.getElementById('walletModal');
const newWalletBtn = document.getElementById('newWalletBtn');
const createWalletBtn = document.getElementById('createWalletBtn');
const walletsList = document.getElementById('walletsList');
const cryptoSelector = document.getElementById('cryptoSelector');

// Show wallet modal
newWalletBtn.addEventListener('click', () => {
    walletModal.style.display = 'block';
    populateCryptoSelector();
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === walletModal) {
        walletModal.style.display = 'none';
    }
});

// Populate crypto selector with available cryptocurrencies
async function populateCryptoSelector() {
    try {
        const token = await getCurrentUserToken();
        if (!token) return;

        const response = await fetch('/api/prices', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const prices = await response.json();
        
        cryptoSelector.innerHTML = prices
            .filter(price => price.symbol.endsWith('USDT'))
            .map(price => `
                <div class="crypto-option">
                    <input type="checkbox" id="${price.symbol}" value="${price.symbol}">
                    <label for="${price.symbol}" class="cyber-label">
                        <span class="symbol">${price.symbol.replace('USDT', '')}</span>
                        <span class="price">$${parseFloat(price.price).toFixed(2)}</span>
                    </label>
                </div>
            `).join('');
    } catch (error) {
        console.error('Error loading cryptocurrencies:', error);
        alert('Failed to load cryptocurrencies. Please try again.');
    }
}

// Create new wallet
createWalletBtn.addEventListener('click', async () => {
    const name = document.getElementById('walletName').value;
    if (!name) {
        alert('Please enter a wallet name');
        return;
    }

    const selectedCryptos = Array.from(document.querySelectorAll('#cryptoSelector input:checked'))
        .map(input => input.value);
    
    if (selectedCryptos.length === 0) {
        alert('Please select at least one cryptocurrency');
        return;
    }

    try {
        const token = await getCurrentUserToken();
        if (!token) return;

        const response = await fetch('/api/wallet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                cryptos: selectedCryptos
            })
        });

        if (response.ok) {
            walletModal.style.display = 'none';
            document.getElementById('walletName').value = '';
            document.querySelectorAll('#cryptoSelector input').forEach(input => input.checked = false);
            await loadUserWallets();
        } else {
            throw new Error('Failed to create wallet');
        }
    } catch (error) {
        console.error('Error creating wallet:', error);
        alert('Failed to create wallet. Please try again.');
    }
});

// Load user's wallets
async function loadUserWallets() {
    try {
        const token = await getCurrentUserToken();
        if (!token) return;

        const response = await fetch('/api/wallets', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const wallets = await response.json();
        
        walletsList.innerHTML = wallets.map(wallet => `
            <div class="wallet-card cyber-card" data-id="${wallet.id}">
                <div class="wallet-header">
                    <h3 class="neon-text">${wallet.name}</h3>
                    <button class="delete-wallet cyber-button-small" onclick="deleteWallet('${wallet.id}')">
                        Delete
                    </button>
                </div>
                <div class="wallet-cryptos">
                    ${wallet.cryptos.map(crypto => `
                        <div class="crypto-item">
                            <span class="symbol">${crypto.replace('USDT', '')}</span>
                            <span class="price" data-symbol="${crypto}">Loading...</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Update crypto prices
        updateWalletPrices();
    } catch (error) {
        console.error('Error loading wallets:', error);
        alert('Failed to load wallets. Please try again.');
    }
}

// Delete wallet
async function deleteWallet(walletId) {
    if (!confirm('Are you sure you want to delete this wallet?')) return;

    try {
        const token = await getCurrentUserToken();
        if (!token) return;

        const response = await fetch(`/api/wallet/${walletId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            await loadUserWallets();
        } else {
            throw new Error('Failed to delete wallet');
        }
    } catch (error) {
        console.error('Error deleting wallet:', error);
        alert('Failed to delete wallet. Please try again.');
    }
}

// Update crypto prices in wallets
async function updateWalletPrices() {
    try {
        const token = await getCurrentUserToken();
        if (!token) return;

        const response = await fetch('/api/prices', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const prices = await response.json();
        
        const priceMap = new Map(prices.map(p => [p.symbol, p.price]));
        
        document.querySelectorAll('.crypto-item .price').forEach(element => {
            const symbol = element.dataset.symbol;
            const price = priceMap.get(symbol);
            if (price) {
                const formattedPrice = parseFloat(price).toFixed(2);
                element.textContent = `$${formattedPrice}`;
                
                // Add price change animation
                const oldPrice = parseFloat(element.dataset.oldPrice || price);
                const newPrice = parseFloat(price);
                if (element.dataset.oldPrice) {
                    element.classList.remove('price-up', 'price-down');
                    if (newPrice > oldPrice) {
                        element.classList.add('price-up');
                    } else if (newPrice < oldPrice) {
                        element.classList.add('price-down');
                    }
                }
                element.dataset.oldPrice = price;
            }
        });
    } catch (error) {
        console.error('Error updating prices:', error);
    }
}

// Update prices every 10 seconds
setInterval(updateWalletPrices, 10000);
