const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Simple database wrapper
function getDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Generate simple token (in production use JWT)
function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// API Routes
app.post('/api/register', (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Name, email, and password required' });

    const db = getDB();
    const uid = email.toLowerCase();
    
    if (db.users[uid]) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const token = generateToken();
    db.users[uid] = {
        name: name,
        password: password, // In production, hash this!
        token: token,
        data: {}
    };
    
    saveDB(db);
    res.json({ token, email: uid, name: name });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const db = getDB();
    const uid = email.toLowerCase();
    const user = db.users[uid];

    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Refresh token
    const token = generateToken();
    user.token = token;
    saveDB(db);

    res.json({ token, email: uid, name: user.name });
});

// Middleware to authenticate
function authenticate(req, res, next) {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    const db = getDB();
    let foundUser = null;
    let foundUid = null;
    
    for (const [uid, user] of Object.entries(db.users)) {
        if (user.token === token) {
            foundUser = user;
            foundUid = uid;
            break;
        }
    }
    
    if (!foundUser) return res.status(401).json({ error: 'Invalid token' });
    
    req.user = foundUser;
    req.uid = foundUid;
    next();
}

app.get('/api/data', authenticate, (req, res) => {
    res.json({ data: req.user.data, profile: { name: req.user.name, email: req.uid } });
});

app.post('/api/data', authenticate, (req, res) => {
    const db = getDB();
    db.users[req.uid].data = req.body;
    saveDB(db);
    res.json({ success: true });
});

// Fallback to index.html for SPA
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
