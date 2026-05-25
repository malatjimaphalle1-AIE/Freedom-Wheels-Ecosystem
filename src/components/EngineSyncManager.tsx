import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEngineStore } from '../store/useEngineStore';

export function EngineSyncManager() {
  const { user } = useAuth();
  const { engines, subscribeToEngines, updateEngineRevenue } = useEngineStore();

  // Handle Subscription
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToEngines(user.uid);
    return () => unsubscribe();
  }, [user, subscribeToEngines]);

  // Handle Background Yield
  useEffect(() => {
    if (!user || engines.length === 0) return;

    const activeEngines = engines.filter(e => e.status === 'ACTIVE');
    if (activeEngines.length === 0) return;

    const interval = setInterval(async () => {
      for (const engine of activeEngines) {
        const multiplier = engine.optimizationMultiplier || 1.0;
        const yieldAmount = (Math.random() * 0.15 + 0.05) * multiplier;
        await updateEngineRevenue(user.uid, engine.id, yieldAmount);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, engines, updateEngineRevenue]);

  return null; // Side-effect only component
}

