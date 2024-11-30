// Initialize Firebase with the config from firebase-config.js
const auth = firebase.auth();

// DOM Elements
const authModal = document.getElementById('authModal');
const authButtons = document.getElementById('authButtons');
const userInfo = document.getElementById('userInfo');
const userEmail = document.getElementById('userEmail');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const closeBtn = document.querySelector('.close-btn');
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const walletsSection = document.getElementById('walletsSection');

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        authButtons.style.display = 'none';
        userInfo.style.display = 'flex';
        userEmail.textContent = user.email;
        walletsSection.style.display = 'block';
        authModal.style.display = 'none';
        // Load user's wallets
        loadUserWallets();
    } else {
        // User is signed out
        authButtons.style.display = 'flex';
        userInfo.style.display = 'none';
        walletsSection.style.display = 'none';
    }
});

// Event Listeners
loginBtn.addEventListener('click', () => {
    authModal.style.display = 'block';
    setActiveTab('login');
});

signupBtn.addEventListener('click', () => {
    authModal.style.display = 'block';
    setActiveTab('signup');
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

closeBtn.addEventListener('click', () => {
    authModal.style.display = 'none';
});

authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        setActiveTab(tab.dataset.tab);
    });
});

// Handle form submissions
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        authModal.style.display = 'none';
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
    } catch (error) {
        alert(error.message);
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        authModal.style.display = 'none';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
    } catch (error) {
        alert(error.message);
    }
});

// Helper Functions
function setActiveTab(tabName) {
    authTabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    if (tabName === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.style.display = 'none';
    }
});

// Helper function to get current user's token
async function getCurrentUserToken() {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
}

// Export getCurrentUserToken for use in other modules
window.getCurrentUserToken = getCurrentUserToken;
