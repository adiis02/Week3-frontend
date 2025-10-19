const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// --- CRITICAL: CORS CONFIGURATION ---
// This tells your Render backend to accept requests from your Netlify frontend.
const corsOptions = {
  origin: 'https://elegantcollectionnew.netlify.app', // IMPORTANT: Make sure this is your exact Netlify URL
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

const usersFilePath = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-is-long'; // Use environment variables in production

// Helper function to read users from the JSON file
const readUsers = () => {
    try {
        if (fs.existsSync(usersFilePath)) {
            const data = fs.readFileSync(usersFilePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Error reading users file:", error);
    }
    return [];
};

// Helper function to write users to the JSON file
const writeUsers = (users) => {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error("Error writing users file:", error);
    }
};

// --- API ROUTES ---
app.get('/api', (req, res) => {
    res.send('API is running...');
});

app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    const users = readUsers();
    if (users.find(user => user.email === email)) {
        return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, email, password: hashedPassword };
    
    users.push(newUser);
    writeUsers(users);

    res.status(201).json({ message: 'User registered successfully! Please log in.' });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const users = readUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
    
    res.json({
        message: 'Login successful!',
        token,
        user: { name: user.name, email: user.email }
    });
});

// --- SERVER INITIALIZATION ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

