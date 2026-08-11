"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignInEmailPassword, useSignUpEmailPassword } from "@nhost/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginView, setIsLoginView] = useState(true);
  const router = useRouter();

  // Nhost Authentication Hooks
  const { signInEmailPassword, isLoading: isSignInLoading, error: signInError } = useSignInEmailPassword();
  const { signUpEmailPassword, isLoading: isSignUpLoading, error: signUpError } = useSignUpEmailPassword();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoginView) {
      const { isSuccess } = await signInEmailPassword(email, password);
      if (isSuccess) {
        router.push("/"); // 🚀 This redirects you to the main page!
      }
    } else {
      const { isSuccess } = await signUpEmailPassword(email, password);
      if (isSuccess) {
        router.push("/"); // 🚀 This redirects you to the main page!
      }
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "20px" }}>
      {/* We are using the 'card' class we created in globals.css */}
      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>
          {isLoginView ? "Sign In to AgentFlow" : "Create an Account"}
        </h2>

        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Display Errors if they happen */}
          {(signInError || signUpError) && (
            <p style={{ color: "#ef4444", fontSize: "0.875rem", marginBottom: "1rem", textAlign: "center" }}>
              {signInError?.message || signUpError?.message}
            </p>
          )}

          {/* Buttons Layout */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button type="submit" disabled={isSignInLoading || isSignUpLoading}>
              {isSignInLoading || isSignUpLoading 
                ? "Please wait..." 
                : (isLoginView ? "Sign In" : "Sign Up")}
            </button>
            
            <button 
              type="button" 
              onClick={() => setIsLoginView(!isLoginView)}
              style={{ backgroundColor: "transparent", color: "var(--primary)", border: "1px solid var(--primary)" }}
            >
              {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}