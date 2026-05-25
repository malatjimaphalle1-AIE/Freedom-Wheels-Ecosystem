import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  Zap,
  AlertCircle,
  Share2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface EngineInteraction {
  sourceEngineId: string;
  targetEngineId: string;
  dataFlow: 'pull' | 'push' | 'bidirectional';
  lastSyncTime?: number;
  syncInterval: number;
  isActive: boolean;
  dataTransferred?: number;
  errorCount?: number;
}

interface EngineInteractionBridgeProps {
  engines: any[];
  isEnabled: boolean;
}

export const EngineInteractionBridge: React.FC<EngineInteractionBridgeProps> = ({
  engines,
  isEnabled
}) => {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<EngineInteraction[]>([]);
  const [syncStats, setSyncStats] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!isEnabled || !engines.length) return;

    const newInteractions: EngineInteraction[] = [];
    engines.forEach(engine => {
      if (engine.config?.connections?.linkedEngines?.length) {
        engine.config.connections.linkedEngines.forEach((targetId: string) => {
          newInteractions.push({
            sourceEngineId: engine.id,
            targetEngineId: targetId,
            dataFlow: engine.config.connections.dataFlow || 'bidirectional',
            syncInterval: engine.config.connections.syncInterval || 30,
            isActive: engine.status === 'ACTIVE',
            dataTransferred: 0,
            errorCount: 0
          });
        });
      }
    });

    setInteractions(newInteractions);
  }, [engines, isEnabled]);

  useEffect(() => {
    if (!interactions.length || !user) return;

    const syncIntervals = interactions.map(interaction => {
      return setInterval(() => {
        handleEngineSyncData(interaction);
      }, interaction.syncInterval * 1000);
    });

    return () => syncIntervals.forEach(clearInterval);
  }, [interactions, user]);

  const handleEngineSyncData = async (interaction: EngineInteraction) => {
    const sourceEngine = engines.find(e => e.id === interaction.sourceEngineId);
    const targetEngine = engines.find(e => e.id === interaction.targetEngineId);

    if (!sourceEngine || !targetEngine || !user) return;

    try {
      let dataToTransfer = 0;

      if (interaction.dataFlow === 'push' || interaction.dataFlow === 'bidirectional') {
        const sourceRevenue = parseFloat((sourceEngine.revenue || '$0.00').replace(/[^0-9.]/g, '')) || 0;
        dataToTransfer = sourceRevenue * 0.05;

        const targetRevenue = parseFloat((targetEngine.revenue || '$0.00').replace(/[^0-9.]/g, '')) || 0;
        const newTargetRevenue = targetRevenue + dataToTransfer;

        await updateDoc(doc(db, 'engines', interaction.targetEngineId), {
          revenue: `$${newTargetRevenue.toFixed(2)}`,
          yieldVelocity: parseFloat((dataToTransfer / interaction.syncInterval).toFixed(6)),
          updatedAt: serverTimestamp()
        });
      }

      if (interaction.dataFlow === 'pull' || interaction.dataFlow === 'bidirectional') {
        const targetIntegrity = targetEngine.neuralIntegrity || 100;
        const sourceIntegrity = sourceEngine.neuralIntegrity || 100;
        if (targetIntegrity > sourceIntegrity) {
          const integrityGain = (targetIntegrity - sourceIntegrity) * 0.1;
          await updateDoc(doc(db, 'engines', interaction.sourceEngineId), {
            neuralIntegrity: Math.min(100, sourceIntegrity + integrityGain),
            updatedAt: serverTimestamp()
          });
        }
      }

      const statKey = `${interaction.sourceEngineId}-${interaction.targetEngineId}`;
      setSyncStats(prev => ({
        ...prev,
        [statKey]: {
          lastSync: new Date().toISOString(),
          dataTransferred: dataToTransfer,
          status: 'success'
        }
      }));

      setInteractions(prev =>
        prev.map(i =>
          i.sourceEngineId === interaction.sourceEngineId && i.targetEngineId === interaction.targetEngineId
            ? {
                ...i,
                lastSyncTime: Date.now(),
                dataTransferred: (i.dataTransferred || 0) + dataToTransfer
              }
            : i
        )
      );
    } catch (err) {
      console.error('Interaction sync failed', err);
      setInteractions(prev =>
        prev.map(i =>
          i.sourceEngineId === interaction.sourceEngineId && i.targetEngineId === interaction.targetEngineId
            ? { ...i, errorCount: (i.errorCount || 0) + 1 }
            : i
        )
      );
      const statKey = `${interaction.sourceEngineId}-${interaction.targetEngineId}`;
      setSyncStats(prev => ({
        ...prev,
        [statKey]: {
          lastSync: new Date().toISOString(),
          status: 'error'
        }
      }));
    }
  };

  const activeInteractions = interactions.filter(i => i.isActive);

  if (!isEnabled || !activeInteractions.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-3 px-4 py-3 bg-accent-blue/5 border border-accent-blue/20 rounded-2xl">
        <Share2 className="w-4 h-4 text-accent-blue" />
        <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">
          {activeInteractions.length} Active Engine Interaction{activeInteractions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <AnimatePresence>
        {activeInteractions.map((interaction, idx) => {
          const sourceEngine = engines.find(e => e.id === interaction.sourceEngineId);
          const targetEngine = engines.find(e => e.id === interaction.targetEngineId);
          const stat = syncStats[`${interaction.sourceEngineId}-${interaction.targetEngineId}`];

          return (
            <motion.div
              key={`${interaction.sourceEngineId}-${interaction.targetEngineId}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                'relative overflow-hidden rounded-xl border p-3 transition-all duration-300',
                stat?.status === 'error'
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-accent-blue/5 border-accent-blue/20 hover:border-accent-blue/40'
              )}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5">
                <motion.div
                  className={cn(
                    'h-full',
                    stat?.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-gradient-to-r from-accent-blue via-accent-gold to-accent-blue'
                  )}
                  animate={{ x: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="p-1.5 bg-accent-blue/10 rounded-lg border border-accent-blue/20 flex-shrink-0">
                    <Zap className="w-3 h-3 text-accent-blue" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-text-main truncate">{sourceEngine?.name || 'Unknown'}</p>
                    <p className="text-[7px] text-text-dim uppercase">Source</p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <motion.div
                    animate={{
                      x:
                        interaction.dataFlow === 'push'
                          ? [0, 4, 0]
                          : interaction.dataFlow === 'pull'
                          ? [4, 0, 4]
                          : [0, 4, 0, -4, 0]
                    }}
                    transition={{ duration: interaction.dataFlow === 'bidirectional' ? 2 : 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4 text-accent-gold" />
                  </motion.div>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <div className="min-w-0 text-right">
                    <p className="text-[9px] font-black text-text-main truncate">{targetEngine?.name || 'Unknown'}</p>
                    <p className="text-[7px] text-text-dim uppercase">Target</p>
                  </div>
                  <div className="p-1.5 bg-accent-gold/10 rounded-lg border border-accent-gold/20 flex-shrink-0">
                    <Activity className="w-3 h-3 text-accent-gold" />
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-[8px]">
                <div>
                  <p className="text-text-dim uppercase tracking-widest font-black">Mode</p>
                  <p className="text-accent-blue font-mono font-black capitalize">{interaction.dataFlow}</p>
                </div>
                <div>
                  <p className="text-text-dim uppercase tracking-widest font-black">Interval</p>
                  <p className="text-accent-gold font-mono font-black">{interaction.syncInterval}s</p>
                </div>
                <div>
                  <p className="text-text-dim uppercase tracking-widest font-black">Transferred</p>
                  <p className="text-emerald-500 font-mono font-black">${(stat?.dataTransferred || 0).toFixed(2)}</p>
                </div>
              </div>

              {stat?.status === 'error' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 flex items-center gap-1.5 p-1.5 bg-red-500/10 border border-red-500/20 rounded text-[8px]"
                >
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  <span className="text-red-400 font-black">Sync Error - Check connection</span>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border-dim bg-bg/30 p-3 space-y-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-text-dim">Interaction Summary</p>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <p className="text-text-dim">Total Data Synced</p>
            <p className="font-mono font-black text-accent-blue">
              ${Object.values(syncStats).reduce((acc, stat: any) => acc + (stat.dataTransferred || 0), 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-text-dim">Active Interactions</p>
            <p className="font-mono font-black text-accent-gold">{activeInteractions.length}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
