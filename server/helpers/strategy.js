import { users, publicKeyCredentials } from '../helpers/database.js'; // Ensure this is correctly imported
import passport from 'passport';
import WebAuthnStrategy from 'passport-fido2-webauthn';
import { SessionChallengeStore } from 'passport-fido2-webauthn';

const store = new SessionChallengeStore();

passport.use(new WebAuthnStrategy({ store: store },
    async (id, userHandle, cb) => {
        try {
            // Find WebAuthn credential
            const credential = await publicKeyCredentials.findOne({ external_id: id });
            if (!credential) return cb(null, false, { message: "Invalid key." });

            // Find the associated user
            const user = await users.findOne({ _id: credential.user_id });
            if (!user) return cb(null, false, { message: "User not found." });

            // Ensure both handles are Buffers before comparing
            if (Buffer.compare(Buffer.from(user.handle), Buffer.from(userHandle)) !== 0) {
                return cb(null, false, { message: "Invalid key." });
            }

            return cb(null, user, credential.public_key);
        } catch (err) {
            return cb(err);
        }
    },
    async (user, id, publicKey, cb) => {
        try {
            // Store user in the database
            const newUser = await users.insertOne({
                email: user.name,
                displayName: user.displayName,
                handle: Buffer.alloc(16).toString('base64'), // Correctly generate a handle
            });

            // Store WebAuthn credentials
            await publicKeyCredentials.insertOne({
                user_id: newUser.insertedId,
                external_id: id,
                public_key: publicKey,
            });

            return cb(null, newUser);
        } catch (err) {
            return cb(err);
        }
    }
));
