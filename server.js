const express = require('express');
const cors = require('cors');
const { Spot } = require('@binance/connector');
const { auth, db } = require('./firebase-config');
const { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where,
    updateDoc,
    doc,
    deleteDoc
} = require('firebase/firestore');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const client = new Spot();

// Middleware to verify Firebase ID token
async function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

app.get('/api/prices', authenticateUser, async (req, res) => {
    try {
        const tickerResponse = await client.tickerPrice();
        res.json(tickerResponse.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/24hr', authenticateUser, async (req, res) => {
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

// Wallet endpoints
app.post('/api/wallet', authenticateUser, async (req, res) => {
    try {
        const { name, cryptos } = req.body;
        const walletRef = await addDoc(collection(db, 'wallets'), {
            userId: req.user.uid,
            name,
            cryptos,
            createdAt: new Date().toISOString()
        });
        res.json({ id: walletRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/wallets', authenticateUser, async (req, res) => {
    try {
        const walletsQuery = query(
            collection(db, 'wallets'), 
            where('userId', '==', req.user.uid)
        );
        const walletsSnapshot = await getDocs(walletsQuery);
        const wallets = [];
        walletsSnapshot.forEach(doc => {
            wallets.push({ id: doc.id, ...doc.data() });
        });
        res.json(wallets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/wallet/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, cryptos } = req.body;
        const walletRef = doc(db, 'wallets', id);
        await updateDoc(walletRef, { name, cryptos });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/wallet/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        await deleteDoc(doc(db, 'wallets', id));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
