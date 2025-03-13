import express from 'express';
import cors from 'cors';
import session from 'express-session';
import bodyParser from 'body-parser';
import passport from 'passport';
import { Strategy as WebAuthnStrategy, SessionChallengeStore } from 'passport-fido2-webauthn';
import NeDB from 'nedb-promises'; // NeDB for storing data
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const store = new SessionChallengeStore();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Initialize NeDB Databases
const usersDb = new NeDB({ filename: './db/users.db', autoload: true });
const credentialsDb = new NeDB({ filename: './db/credentials.db', autoload: true });

// WebAuthn Strategy
passport.use(new WebAuthnStrategy({ store: store },
    async function verify(id, userHandle, cb) {
        try {
            // Fetch the credential by external ID (the key's ID)
            const credential = await credentialsDb.findOne({ external_id: id });
            if (!credential) {
                return cb(null, false, { message: 'Invalid key.' });
            }

            // Fetch the user linked with the credential
            const user = await usersDb.findOne({ _id: credential.user_id });
            if (!user) {
                return cb(null, false, { message: 'User not found.' });
            }

            // Verify that the user handle matches the one stored
            if (Buffer.compare(user.handle, userHandle) !== 0) {
                return cb(null, false, { message: 'Invalid key.' });
            }

            // Successful authentication
            return cb(null, user, credential.public_key);
        } catch (err) {
            return cb(err);
        }
    },
    async function register(user, id, publicKey, cb) {
        try {
            // Create new user in the users database
            const newUser = await usersDb.insert({
                username: user.name,
                name: user.displayName,
                handle: user.id
            });

            // Insert credential into the credentials database
            await credentialsDb.insert({
                user_id: newUser._id,
                external_id: id,
                public_key: publicKey
            });

            return cb(null, newUser);
        } catch (err) {
            return cb(err);
        }
    }
));

// Register route (trigger WebAuthn registration)
app.post('/register', async (req, res) => {
    try {
        const { username, email } = req.body;

        // Check if the user already exists
        const user = await usersDb.findOne({ username });
        if (!user) {
            user = {
                id: crypto.randomUUID(),
                username,
                email,
                displayName: username,
                handle: crypto.randomBytes(32) // Random handle for WebAuthn
              };
              await usersDB.insert(user);
            }
          
            // WebAuthn registration options
            const options = {
              rp: { name: "My WebAuthn App" },
              user: {
                id: user.handle.toString('base64url'),
                name: user.username,
                displayName: user.displayName
              },
              challenge,
              pubKeyCredParams: [
                { type: 'public-key', alg: -7 },  // ES256
                { type: 'public-key', alg: -257 } // RS256
              ],
              authenticatorSelection: {
                userVerification: 'preferred',
              }
            };
          
            res.json({ challenge, user: options.user });
        

        // Trigger WebAuthn registration (details would go here)
        // You can generate WebAuthn challenge here if needed

    } catch (err) {
        res.status(500).json({ message: 'Error during registration' });
    }
});

// Login route (verify WebAuthn authentication)
app.post('/login', async (req, res) => {
    try {
        const { username, publicKey } = req.body;

        // Check if the user exists
        const user = await usersDb.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Start WebAuthn authentication here
        // Send challenge for WebAuthn authentication

        res.status(200).json({ message: 'Login initiated' });
    } catch (err) {
        res.status(500).json({ message: 'Error during login' });
    }
});

// Middleware to check authentication
app.use((req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
});

// Protected route example (after successful authentication)
app.get('/protected', (req, res) => {
    res.status(200).json({ message: 'Protected route access granted!' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
