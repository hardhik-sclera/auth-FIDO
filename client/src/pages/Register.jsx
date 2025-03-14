import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {base64url} from 'base64url'; //
import Loading from './Loading';


const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading]= useState(false)
    const navigate = useNavigate();


    function base64urlDecode(base64urlString) {
        let base64 = base64urlString.replace(/-/g, '+').replace(/_/g, '/'); 
        while (base64.length % 4) {
            base64 += '=';
        }
    
        
        return Uint8Array.from(atob(base64), c => c.charCodeAt(0)); 
    }

    
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/register", { username, email });
            const options = res.data;
            console.log(options);
            
    
            
           
            /* setTimeout(() => {
                setLoading(true);
            }, 4000); */
            const credential = await navigator.credentials.create({
                publicKey: {
                    rp: { name: "Fido Auth" },
                    user: {
                        id: base64urlDecode(options.user.id), 
                        name: options.user.name,
                        displayName: options.user.displayName
                    },
                    challenge: base64urlDecode(options.challenge),
                    pubKeyCredParams: [
                        { type: "public-key", alg: -7 },  // ES256
                        { type: "public-key", alg: -257 } // RS256
                    ],
                    authenticatorSelection: {
                        userVerification: "required"
                    }
                }
            })
            
            console.log("Credential created:", credential);
    
            if (!credential) {
                console.warn("WebAuthn failed: No credentials received.");
                setLoading(false); 
                return;
            }
    
        
            const credentialData = {
                id: credential.id,
                rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
                response: {
                    attestationObject: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject))),
                    clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON)))
                },
                type: credential.type
            };
            console.log(credential.rawId);
            console.log((new Uint8Array(credential.rawId)));
            console.log(String.fromCharCode(new Uint8Array(credential.rawId)));
            console.log(String.fromCharCode(...new Uint8Array(credential.rawId)));
            console.log(btoa(String.fromCharCode(...new Uint8Array(credential.rawId))));
            
    
            await axios.post("/register/verify", credentialData)
                .then((response) => {
                    console.log("ok: ", response);
                    toast.success("Registration success");
                    navigate('/');
                });
    
        } catch (error) {
            console.error("Registration failed:", error);
            toast.error("Registration failed");
        } finally {
            setLoading(false);  // Stop loading after process completion
        }
    };
    
    return (
        (loading)?<Loading/>:
        <div className="main-container">
            <div className="auth-block">
                <div className="text-center space-y-2">
                    <h2 className="main-header">
                        Create Account
                    </h2>
                    <p className="text-gray-600">Please fill in your details to register</p>
                </div>
                
                <form className="space-y-5" onSubmit={handleRegister}>
                    <div className="space-y-2">
                        <label htmlFor="username" className="form-label">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="form-input"
                            placeholder="Enter your username"
                            required
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="email" className="form-label">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    {/* <div className="space-y-2">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input"
                            placeholder="Create a password"
                            required
                        />
                    </div> */}

                    <button
                        type="submit"
                        className="form-button"
                    >
                        Create Account
                    </button>

                    <div className="text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="navigation-link"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;