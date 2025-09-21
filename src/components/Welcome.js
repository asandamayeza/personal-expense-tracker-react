import React, { useState, useEffect } from "react";
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    createUserWithEmailAndPassword, //register function implemented
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase.js"
import { Link } from "react-router-dom";
import { Form } from "react-bootstrap";
import { Button } from "react-bootstrap";
import "./welcome.css";
import GoogleButton from "react-google-button";
import { useNavigate } from "react-router-dom";



export default function Welcome() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false); //creating account
    const [registerInformation, setRegisterInformation] = useState({
        email: "",
        confirmEmail: "",
        password: "",
        confirmPassword: ""
    });
    const navigate = useNavigate();
    const provider = new GoogleAuthProvider();



    useEffect(() => {
        auth.onAuthStateChanged((user) => {
            if (user) { //if users sign in , navigated to homepage automatically
                navigate("/home");
            }
        });
    }, []);



    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleSignIn = () => {
        signInWithEmailAndPassword(auth, email, password)
            .then(() => {//if the sign in is correct we will then be directed/navigated to homepage
                navigate("/home");
            })
            .catch((err) => alert(err.message)); //if the user gets an error it will alert the user
    };


   
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    

    const handleGoogleSignIn = async () => {
        try {
           const results= await signInWithPopup(auth, provider);
            const authInfo = {
                userID: results.user.uid,
                name: results.user.displayName, //newly added 20/09/2025
                profilePhoto: results.user.photoURL,
                isAuth: true,
            };
            localStorage.setItem("auth", JSON.stringify(authInfo));
            navigate("/home");
        }
        catch (error) {
            console.error('Error signing in:', error);
        }

    }



    const handleRegister = () => {
        if (registerInformation.email !== registerInformation.confirmEmail) {
            alert("Please confirm that email are the same");
            return;
        } else if (
            registerInformation.password !== registerInformation.confirmPassword
        ) {
            alert("Please confirm that password are the same");
            return;
        }
        createUserWithEmailAndPassword( //final created account, if handle register is a success
            auth,
            registerInformation.email,
            registerInformation.password
        )
            .then(() => {
                navigate("/home");
            })
            .catch((err) => alert(err.message));
    };

    return (
        <div className="welcome">
            
            <h1>Finance Tracker</h1>
            <div className="login-register-container">
                {isRegistering ? (//if isRegistering is true then we are registiring 
                    <>
                        <input
                            type="email"
                            placeholder="Email"
                            value={registerInformation.email}
                            onChange={(e) =>
                                setRegisterInformation({
                                    ...registerInformation,
                                    email: e.target.value
                                })
                            }
                        />
                        <input
                            type="email"
                            placeholder="Confirm Email"
                            value={registerInformation.confirmEmail}
                            onChange={(e) =>
                                setRegisterInformation({
                                    ...registerInformation,
                                    confirmEmail: e.target.value
                                })
                            }
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={registerInformation.password}
                            onChange={(e) =>
                                setRegisterInformation({
                                    ...registerInformation,
                                    password: e.target.value
                                })
                            }
                        />
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={registerInformation.confirmPassword}
                            onChange={(e) =>
                                setRegisterInformation({
                                    ...registerInformation,
                                    confirmPassword: e.target.value
                                })
                            }
                        />
                        <button className="sign-in-register-button" onClick={handleRegister}>Register</button>
                        <div className="create-account-button" onClick={() => setIsRegistering(false)}>Already have an account? <Link>Log In</Link></div>
                    </>
                ) : (
                    <>
                        <input type="email" placeholder="Email" onChange={handleEmailChange} value={email} />
                        <input
                            type="password"
                            onChange={handlePasswordChange}
                            value={password}
                            placeholder="Password"
                        />

                        <button className="sign-in-register-button" onClick={handleSignIn}>
                            Log In
                        </button>



                        <div className="google-button-container">
                            <GoogleButton className="g-btn" type="dark" onClick={handleGoogleSignIn} />
                        </div>

                        <div className="create-account-button"
                            onClick={() => setIsRegistering(true)}>
                            Don't have an account ? <Link >Sign Up</Link>
                        </div>



                    </>
                )}
            </div>
        </div>
    );
}