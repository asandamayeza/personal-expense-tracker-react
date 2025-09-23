import React, { useState, useEffect } from "react";
import {
    signInWithEmailAndPassword, //logging in our users
    onAuthStateChanged, //for tracking the user login state
    createUserWithEmailAndPassword, // for registering new users
    GoogleAuthProvider, //for google login
    signInWithPopup, //for google login popup
} from "firebase/auth";
import { auth } from "../firebase.js"
import { Link } from "react-router-dom";
import { Form } from "react-bootstrap";
import { Button } from "react-bootstrap";
import "./welcome.css";
import GoogleButton from "react-google-button";
import { useNavigate } from "react-router-dom";



export default function Welcome() {
    //for login
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    //showing registration form instead of login form
    const [isRegistering, setIsRegistering] = useState(false); //creating account
    const [registerInformation, setRegisterInformation] = useState({
        email: "",
        confirmEmail: "",
        password: "",
        confirmPassword: ""
    });

    const navigate = useNavigate();
    const provider = new GoogleAuthProvider();//initialize google login provider



    useEffect(() => {
        auth.onAuthStateChanged((user) => {
            if (user) { //if users sign in , navigated to homepage automatically
                navigate("/home");
            }
        });
    }, []);



    const handleEmailChange = (e) => {
        setEmail(e.target.value); //update email input
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value); //update password input
    };

    const handleSignIn = () => {
        //firebase function to sign in using email and password
        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            const user = userCredential.user;
            const authInfo = {
              userID: user.uid,
              email: user.email,
              name: user.email.split("@")[0], //for fake user email, use word before @ for user name
              profilePhoto: user.photoURL || null, //no photo for fake users
              isAuth: true,
            };
            localStorage.setItem("auth", JSON.stringify(authInfo));
            navigate("/home");
          })
          .catch((err) => alert(err.message));
      };


   
    provider.setCustomParameters({
      prompt: 'select_account' //asking users to choose account
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
            //saving google users info to localStorage
            localStorage.setItem("auth", JSON.stringify(authInfo));
            navigate("/home");
        }
        catch (error) {
            console.error('Error signing in:', error);
        }

    }



    const handleRegister = () => {
        //validating email match
        if (registerInformation.email !== registerInformation.confirmEmail) {
          alert("Please confirm that emails are the same");
          return;
        }
        //validating password match
         else if (
          registerInformation.password !== registerInformation.confirmPassword
        ) {
          alert("Please confirm that passwords are the same");
          return;
        }
        //registering user using firebase
        createUserWithEmailAndPassword(
          auth,
          registerInformation.email,
          registerInformation.password
        )
          .then((userCredential) => {
            const user = userCredential.user;
            const authInfo = {
              userID: user.uid, 
              email: user.email,
              name: user.email.split("@")[0], //fake users email
              profilePhoto: user.photoURL || null,
              isAuth: true,
            };
            //saved to local storage 
            localStorage.setItem("auth", JSON.stringify(authInfo));
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