/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import EngineBuilder from "./pages/EngineBuilder";
import LeadIntelligence from "./pages/LeadIntelligence";
import Wallet from "./pages/Wallet";
import Marketplace from "./pages/Marketplace";
import NicheAnalysis from "./pages/NicheAnalysis";
import Leaderboard from "./pages/Leaderboard";
import Referrals from "./pages/Referrals";
import TrafficEngine from "./pages/TrafficEngine";
import AutomationHub from "./pages/AutomationHub";
import JoinPage from "./pages/JoinPage";
import KnowledgeBase from "./pages/KnowledgeBase";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";
import OnboardingTour from "./components/OnboardingTour";
import ErrorBoundary from "./components/ErrorBoundary";
import MainLayout from "./components/MainLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { EngineSyncManager } from "./components/EngineSyncManager";
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Capture referral from URL if present
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      sessionStorage.setItem('referredBy', ref);
      console.log("Sovereign Registry: Referral protocol captured ::", ref);
    }

    const hasCompletedOnboarding = localStorage.getItem("sovereign_onboarding_engaged");
    if (!hasCompletedOnboarding) {
      // Small delay to ensure core stabilization before launching tour
      const timer = setTimeout(() => setShowOnboarding(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("sovereign_onboarding_engaged", "true");
    setShowOnboarding(false);
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <EngineSyncManager />
        <Router>
            <OnboardingTour isOpen={showOnboarding} onComplete={handleComplete} />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/builder" element={<EngineBuilder />} />
                <Route path="/leads" element={<LeadIntelligence />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/analysis" element={<NicheAnalysis />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/referrals" element={<Referrals />} />
                <Route path="/traffic" element={<TrafficEngine />} />
                <Route path="/automation" element={<AutomationHub />} />
                <Route path="/knowledge" element={<KnowledgeBase />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<UserProfile />} />
              </Route>
              <Route path="/join" element={<JoinPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

