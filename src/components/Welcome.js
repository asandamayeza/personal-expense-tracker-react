import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword, //logging in our users
  createUserWithEmailAndPassword, //for registering new users 
  GoogleAuthProvider, //for google login
  signInWithPopup, //for google login popup
} from "firebase/auth";
import { auth } from "../firebase.js";
import "./welcome.css";
import GoogleButton from "react-google-button";
import { useNavigate } from "react-router-dom";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&auto=format&fit=crop&q=80";

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
    confirmPassword: "",
  });

  const navigate = useNavigate();
  const provider = new GoogleAuthProvider(); //initialize google login provider

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) navigate("/home");
    });
  }, [navigate]);

  provider.setCustomParameters({ prompt: "select_account" }); //asking user to choose accounf

  const handleSignIn = () => {
    //firebase function to sign in using email and password
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const authInfo = {
          userID: user.uid,
          email: user.email,
          name: user.email.split("@")[0], //for fake user email, use word before @ for user name
          profilePhoto: user.photoURL || null, //no photo for fake uder
          isAuth: true,
        };
        localStorage.setItem("auth", JSON.stringify(authInfo));
        navigate("/home");
      })
      .catch((err) => alert(err.message));
  };

  const handleGoogleSignIn = async () => {
    try {
      const results = await signInWithPopup(auth, provider);
      const authInfo = {
        userID: results.user.uid,
        name: results.user.displayName,
        profilePhoto: results.user.photoURL,
        isAuth: true,
      };
      //ssaving google users infor to local storage
      localStorage.setItem("auth", JSON.stringify(authInfo));
      navigate("/home");
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleRegister = () => {
    //validationg email match
    if (registerInformation.email !== registerInformation.confirmEmail) {
      alert("Please confirm that emails are the same");
      return;
      //validating the password match
    } else if (
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
    <div className="welcome-page">
      {/* LEFT PANEL*/}
      <div className="welcome-hero">
        <img
          className="welcome-hero-img"
          src={HERO_IMAGE}
          alt="Finance background"
        />
        <div className="welcome-hero-overlay">
          {/* Brand mark */}
          <div className="hero-brand">
            <div className="hero-brand-icon">PT</div>
            <div className="hero-brand-name">PERSONAL TRACKER</div>
          </div>

          {/* Bottom copy */}
          <h2 className="hero-tagline">
            Your wealth, <br />
            <strong>precisely tracked.</strong>
          </h2>
          <p className="hero-sub">
            A personal finance platform built for those who
            demand clarity, control, and confidence over their money.
          </p>

        </div>
      </div>

      {/* RIGHT FORM PANEL  */}
      <div className="welcome-form-panel">
        <div className="welcome">
          <div className="welcome-header">
            <div className="welcome-greeting">
              {isRegistering ? "Create Account" : "Welcome Back"}
            </div>
            <h1 className="welcome-title">
              {isRegistering ? "Join Personal Tracker today" : "Sign in to your account"}
            </h1>
            <p className="welcome-subtitle">
              {isRegistering
                ? "Start tracking your finances with precision."
                : "Enter your credentials to access your dashboard."}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${!isRegistering ? "active" : ""}`}
              onClick={() => setIsRegistering(false)}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${isRegistering ? "active" : ""}`}
              onClick={() => setIsRegistering(true)}
            >
              Register
            </button>
          </div>

          <div className="login-register-container">
            {isRegistering ? (
              <>
                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={registerInformation.email}
                    onChange={(e) =>
                      setRegisterInformation({
                        ...registerInformation,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Confirm Email</label>
                  <input
                    type="email"
                    placeholder="Confirm your email"
                    value={registerInformation.confirmEmail}
                    onChange={(e) =>
                      setRegisterInformation({
                        ...registerInformation,
                        confirmEmail: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Create a strong password"
                    value={registerInformation.password}
                    onChange={(e) =>
                      setRegisterInformation({
                        ...registerInformation,
                        password: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Repeat your password"
                    value={registerInformation.confirmPassword}
                    onChange={(e) =>
                      setRegisterInformation({
                        ...registerInformation,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <button
                  className="sign-in-register-button"
                  onClick={handleRegister}
                >
                  Create Account
                </button>
                <div
                  className="create-account-button"
                  onClick={() => setIsRegistering(false)}
                >
                  Already have an account?{" "}
                  <span style={{ color: "var(--gold)", cursor: "pointer" }}>
                    Sign In
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                  />
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    placeholder="Your password"
                  />
                </div>
                <div className="forgot-link">Forgot password?</div>

                <button
                  className="sign-in-register-button"
                  onClick={handleSignIn}
                >
                  Sign In
                </button>

                <div className="divider">or continue with</div>

                <div className="google-button-container">
                  <GoogleButton
                    className="g-btn"
                    type="dark"
                    onClick={handleGoogleSignIn}
                    style={{ width: "100%", borderRadius: "10px" }}
                  />
                </div>

                <div
                  className="create-account-button"
                  onClick={() => setIsRegistering(true)}
                >
                  Don't have an account?{" "}
                  <span style={{ color: "var(--gold)", cursor: "pointer" }}>
                    Sign Up
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
