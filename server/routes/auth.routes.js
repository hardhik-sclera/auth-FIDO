import { Router } from "express";
import base64url from 'base64url';
import crypto from 'crypto';
import {Fido2Lib} from 'fido2-lib';
import jwt from 'jsonwebtoken'
import pkg from 'node-jose';
const {JWK} = pkg;

import '../helpers/strategy.js';
import { users } from '../helpers/database.js';



const router = Router();


const fido2 = new Fido2Lib({
    timeout: 60000,
    rpId: "localhost", // Change this to your domain in production
    rpName: "My App",
    challengeSize: 32,
    attestation: "direct",
    cryptoParams: [-7, -257]
});

async function convertJwkToPem(jwk) {
    const key = await JWK.asKey(jwk);
    return key.toPEM();
}
router.post('/register', async (req, res) => {
    try {
        const { username, email } = req.body;

        // Generate a random challenge
        const challenge = base64url.encode(crypto.randomBytes(32));
        console.log(challenge);
        
        // Check if the user already exists
        let user = await users.findOne({ username });
        if (!user) {
            user = {
                username,
                email,
                displayName: username,
                userHandle: crypto.randomBytes(32),
                challenge // Random handle for WebAuthn
            };

            
            await users.insert(user);
        }
        else{
            return res.status(400).json({message: 'User already exists'});
        }

        const options = {
            rp: { name: "Fido Auth" },
            user: {
                id: base64url.encode(user.userHandle),
                name: user.username,
                displayName: user.displayName
            },
            challenge,  
            pubKeyCredParams: [
                { type: 'public-key', alg: -7 },  // ES256
                { type: 'public-key', alg: -257 } // RS256
            ],
            authenticatorSelection: {
                userVerification: 'required',
            }
        };

        res.json({ challenge, user:options.user });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error during registration' });
    }
});



router.post('/register/verify', async (req, res) => {

    try {
        const { id,rawId, response, type } = req.body;
        console.log("req.body: ", req.body);

        // Decode clientDataJSON
        const decodedClientDataJSON = JSON.parse(
            Buffer.from(response.clientDataJSON, 'base64').toString('utf-8')
        );
        console.log("clientDataJSON: ", decodedClientDataJSON);
        console.log("origin: ", decodedClientDataJSON.origin);
        
        // Find the user by challenge
        const user = await users.findOne({ challenge: decodedClientDataJSON.challenge });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Verify Attestation using Fido2Lib instance
       // Convert rawId to ArrayBuffer correctly
const rawIdBuffer = new Uint8Array(base64url.toBuffer(req.body.rawId)).buffer;
/* console.log("raw id: ",Buffer.from(rawIdBuffer).toString('base64')); */
console.log("raw id: ",rawIdBuffer);

const clientDataJSONBuffer= new Uint8Array(base64url.toBuffer(req.body.response.clientDataJSON)).buffer;
const attestationObjectBuffer= new Uint8Array(base64url.toBuffer(req.body.response.attestationObject)).buffer;
const attestationResult = await fido2.attestationResult({
    id: req.body.id,  
    rawId: rawIdBuffer,  
    response: {
        clientDataJSON: clientDataJSONBuffer,
        attestationObject: attestationObjectBuffer
    }
}, {
    challenge: user.challenge,
    origin: decodedClientDataJSON.origin,
    factor: 'either'
});
/* console.log("regi Stored Challenge:", user.challenge);
console.log("regi Client Challenge:", deco.challenge);
 */
        // Store WebAuthn credential
        const publicKeyCose = attestationResult.authnrData.get('credentialPublicKeyJwk');
console.log("Raw COSE Public Key:", publicKeyCose);
console.log("Full authnrData:", attestationResult.authnrData);

        await users.updateOne(
            { challenge: decodedClientDataJSON.challenge },
            {
                $set: {
                    rawId,
                    response,
                    type,
                    credentialId: Buffer.from(new Uint8Array(attestationResult.authnrData.get('credId'))).toString('base64'),
                    publicKey: attestationResult.authnrData.get('credentialPublicKeyJwk'),
                    counter: attestationResult.authnrData.get('counter')
                }
            }
        );
        console.log("Verificaion successful");
        return res.json({ success: true });
    } catch (error) {
        console.error("Credentials not saved:", error);
        return res.status(400).json({ message: "Error", error });
    }
});


router.post('/login', async (req, res) => {
    const { username } = req.body;
    const challenge = base64url.encode(crypto.randomBytes(32)); // Generate a fresh challenge

    const user = await users.findOne({ username });
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    // Store the challenge in the database for later verification
    await users.updateOne({ username }, { $set: { challenge } });

    return res.status(200).json({ challenge, credentialId: user.credentialId });
});


router.post('/login/verify', async (req, res) => {
    try {
        const { authData:{id, rawId, response, type}, username } = req.body;
     /*    console.log("rawID: ",rawId);
        
        console.log("req.body: ", req.body); */
      
        const decodedClientDataJSON = JSON.parse(
            Buffer.from(response.clientDataJSON, 'base64').toString('utf-8')
        );
        
        const user = await users.findOne({ username});
      /*   console.log("user: ", user); */
        
        if (!user) {
            return res.status(400).json({ message: "User not found while verifyinh" });
        }


        const rawIdBuffer = new Uint8Array(base64url.toBuffer(rawId)).buffer;
        const clientDataBuffer = new Uint8Array(base64url.toBuffer(response.clientDataJSON)).buffer;
        const authenticatorDataBuffer = new Uint8Array(base64url.toBuffer(response.authenticatorData)).buffer;
        const signatureBuffer = new Uint8Array(base64url.toBuffer(response.signature)).buffer;  

        const publicKeyPem = await convertJwkToPem(user.publicKey)
      /*   console.log("publicKeyPem: ",publicKeyPem);
        console.log("Type of publicKeyPem:", typeof publicKeyPem); */
        const cleanedPublicKeyPem = publicKeyPem.replace(/\r?\n/g, '\n').trim();
        console.log("Client Challenge:", decodedClientDataJSON.challenge);
        console.log("Stored Challenge:", user.challenge);
        const userHandleBuffer = Buffer.from(Object.values(user.userHandle));
        const userHandle = userHandleBuffer.toString("base64");
        const assertionResult = await fido2.assertionResult({
            id,
            rawId: rawIdBuffer,
            response: {
                authenticatorData: authenticatorDataBuffer,  
                clientDataJSON: clientDataBuffer,
                signature: signatureBuffer
            }
        }, {
            challenge: user.challenge,
            origin: decodedClientDataJSON.origin,
            factor: "either",
            publicKey: cleanedPublicKeyPem,  
            prevCounter: user.counter,
            userHandle:userHandle   
        });

        
        await users.updateOne(
            { challenge: decodedClientDataJSON.challenge },
            { $set: { counter: assertionResult.authnrData.get("counter") } }
        );

        const accessToken = generateAccessToken({ username });
        const refreshToken = generateRefreshToken({ username });

        res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "none" });
        res.json({ message: "Login successful", success: true ,accessToken});
    } catch (error) {
        console.error("Login verification error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


router.get('/home',async(req,res)=>{
    res.send("Welcome")
})

function generateAccessToken(user) {
    const { exp, iat, ...userWithoutExp } = user; 
    return jwt.sign(userWithoutExp, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15s" });
}


function generateRefreshToken(user) {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
}


router.post("/refresh", (req, res) => {
    const refreshToken = req.cookies.refreshToken; // Retrieve refreshToken from HttpOnly cookie
    console.log("Cookies received:", req.cookies);
    if (!refreshToken) {
      return res.status(403).json({ error: "No refresh token" });
    }
  
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid refresh token" });
      const newAccessToken = generateAccessToken(user);
      res.json({ accessToken: newAccessToken });
    });
  });
  



export default router;
