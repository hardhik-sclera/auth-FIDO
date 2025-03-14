import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
    const [username, setUsername] = useState('');
    const [token, setToken] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            console.log("Access Token Updated:", token);
        }
    }, [token]); // Logs the token whenever it updates

    function base64urlDecode(base64urlString) {
        let base64 = base64urlString.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/login', { username });

            if (response) {
                const credential = await navigator.credentials.get({
                    publicKey: {
                        challenge: base64urlDecode(response.data.challenge),
                        allowCredentials: [{
                            id: base64urlDecode(response.data.credentialId),
                            type: "public-key"
                        }],
                        userVerification: "preferred"
                    }
                });

                const authData = {
                    id: credential.id,
                    rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
                    response: {
                        authenticatorData: btoa(String.fromCharCode(...new Uint8Array(credential.response.authenticatorData))),
                        clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
                        signature: btoa(String.fromCharCode(...new Uint8Array(credential.response.signature)))
                    },
                    type: credential.type
                };

                const verifyResponse = await axios.post('/login/verify', { authData, username });

                if (verifyResponse.data) {
                    toast.success("Login successful");

                    const accessToken = verifyResponse.data.accessToken;
                    setToken(accessToken); // ✅ Updates state
                    localStorage.setItem("accessToken", accessToken); // ✅ Stores for later use
                    
                    console.log("AccessToken set:", accessToken);

                    setUsername("");
                    navigate('/home');
                } else {
                    toast.error("Login failed");
                }
            }
        } catch (error) {
            toast.error("Login failed");
            console.error('Login failed:', error);
        }
    };

    return (
        <div className="main-container">
            <div className="auth-block">
                <div className="text-center space-y-2">
                    <h2 className="main-header">Welcome Back</h2>
                    <p className="text-gray-600">Please sign in to continue</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label htmlFor="username" className="form-label">Username</label>
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

                    <button type="submit" className="form-button">Sign In</button>
                </form>

                <div className="text-center text-sm text-gray-600">
                    <p>Not registered yet? <Link className='navigation-link' to='/register'>Register</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
