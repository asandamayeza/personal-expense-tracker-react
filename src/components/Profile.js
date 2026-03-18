
import React, { useState } from "react";
import { signOut }         from "firebase/auth";
import { auth }            from "../firebase.js";
import { useNavigate }     from "react-router-dom";
import { useGetUserInfo }     from "../hooks/useGetUserInfo.js";
import { useGetTransactions } from "../hooks/useGetTransactions.js";

import "./profile.css";

function fmt(n) {
  return "R " + Math.abs(Number(n)).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Profile() {

  
  const navigate = useNavigate();
  const { name, profilePhoto, userID, email } = useGetUserInfo();
  const { transactions, transactionTotals } = useGetTransactions();
  const { balance, income, expenses } = transactionTotals;
  const savingsRate = income > 0
    ? Math.max(0, Math.round(((income - expenses) / income) * 100))
    : 0;

  const [displayName, setDisplayName] = useState(name || "");

  // Monthly spending limit in Rands (used by the budget bar on the dashboard)
  const [budgetLimit, setBudgetLimit] = useState("20000");

  // Preferred currency for display (default: South African Rand)
  const [currency, setCurrency] = useState("ZAR");

  // Controls the "Saved!" confirmation state on the Save button
  const [saved, setSaved] = useState(false);

  const [toggles, setToggles] = useState({
    emailNotif:    true,  // send monthly email summaries
    monthlyReport: true,  // auto-generate a monthly PDF report
    darkMode:      true,  // use the dark colour scheme (currently always on)
  });

  const handleSave = () => {
    setSaved(true);
    // Reset the button label back to "Save Changes" after 2.5 seconds
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.clear();
    navigate("/");
  };

  //  MEMBER SINCE DATE 
  const memberSince = (() => {
    const user = auth.currentUser;
    if (!user?.metadata?.creationTime) return "—";
    return new Date(user.metadata.creationTime).toLocaleDateString("en-ZA", {
      month: "long",
      year:  "numeric",
    });
  })();


  return (
    <div className="profile-page">
      <div className="profile-hero">
  
        <div className="profile-avatar-wrap">
          {profilePhoto ? (
            // Show the Google profile photo if signed in with Google
            <img
              className="profile-avatar"
              src={profilePhoto}
              referrerPolicy="no-referrer" // prevents leaking the current URL to Google
              alt="Profile"
            />
          ) : (
            // for fake users
            <div className="profile-avatar">👤</div>
          )}
          
          <div className="profile-avatar-ring" />
        </div>

        {/* Name, email, and badge row */}
        <div className="profile-hero-info">
          {/* Show the user's name, or "Your Account" as a fallback */}
          <div className="profile-hero-name">{name || "Your Account"}</div>

          {/* Email address — falls back to the Firebase UID if email isn't stored */}
          <div className="profile-hero-email">{email || userID}</div>

          {/* Status badges — account type, verification, member since date */}
          <div className="profile-hero-badges">
            <span className="ph-badge gold">Member since {memberSince}</span>
          </div>
        </div>

        {/* Sign Out button — top-right corner of the hero card */}
        <div className="profile-hero-actions">
          <button className="btn-signout" onClick={handleSignOut}>
            ↩ Sign Out
          </button>
        </div>
      </div>


      <div className="profile-two-col">

        </div>

       
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

         

          <div className="profile-card">
            <div className="pc-header">
              <div className="pc-title">Preferences</div>
            </div>

            {[
              {
                key:   "emailNotif",
                label: "Email Notifications",
                desc:  "Receive monthly summaries",
              },
              
            ].map(({ key, label, desc }) => (
              <div key={key} className="pref-row">
                <div>
                  <div className="pref-label">{label}</div>
                  <div className="pref-desc">{desc}</div>
                </div>
               
              </div>
            ))}
          </div>
        </div>
      </div>

      

   
  );
}
