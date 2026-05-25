import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Settings,
  Save,
  X,
  Link2,
  Zap,
  AlertCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEngineStore } from '../store/useEngineStore';
import { useAuth } from '../contexts/AuthContext';

interface EngineConfig {
  engineId: string;
  name: string;
  parameters: {
    performanceThreshold: number;
    autoOptimize: boolean;
    riskLevel: 'conservative' | 'moderate' | 'aggressive';
    maxAllocation: number;
    enableInteractions: boolean;
  };
  connections: {
    linkedEngines: string[];
    dataFlow: 'pull' | 'push' | 'bidirectional';
    syncInterval: number;
  };
  alerts: {
    enableLowIntegrity: boolean;
    enableHighPerformance: boolean;
    integrityThreshold: number;
    performanceThreshold: number;
  };
}

interface EngineConfigPanelProps {
  engine: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: EngineConfig) => Promise<void> | void;
}

const defaultConfig: Omit<EngineConfig, 'engineId' | 'name'> = {
  parameters: {
    performanceThreshold: 70,
    autoOptimize: true,
    riskLevel: 'moderate',
    maxAllocation: 100,
    enableInteractions: true
  },
  connections: {
    linkedEngines: [],
    dataFlow: 'bidirectional',
    syncInterval: 30
  },
  alerts: {
    enableLowIntegrity: true,
    enableHighPerformance: true,
    integrityThreshold: 20,
    performanceThreshold: 90
  }
};

export const EngineConfigPanel: React.FC<EngineConfigPanelProps> = ({
  engine,
  isOpen,
  onClose,
  onSave
}) => {
  const { engines } = useEngineStore();
  const { user } = useAuth();
  const [config, setConfig] = useState<EngineConfig>({
    engineId: engine?.id || '',
    name: engine?.name || '',
    ...defaultConfig
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!engine) return;

    const existingConfig = engine.config || defaultConfig;
    setConfig({
      engineId: engine.id,
      name: engine.name,
      parameters: existingConfig.parameters,
      connections: existingConfig.connections,
      alerts: existingConfig.alerts
    });
  }, [engine]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      await onSave(config);
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error('Failed to save engine config', err);
      setIsSaving(false);
    }
  };

  const handleAddLinkedEngine = (engineId: string) => {
    if (!engineId || config.connections.linkedEngines.includes(engineId)) return;
    setConfig(prev => ({
      ...prev,
      connections: {
        ...prev.connections,
        linkedEngines: [...prev.connections.linkedEngines, engineId]
      }
    }));
  };

  const handleRemoveLinkedEngine = (engineId: string) => {
    setConfig(prev => ({
      ...prev,
      connections: {
        ...prev.connections,
        linkedEngines: prev.connections.linkedEngines.filter(id => id !== engineId)
      }
    }));
  };

  const availableEngines = engines.filter((e: any) => e.id !== engine?.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-surface border border-border-dim rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-bg/95 backdrop-blur z-10 border-b border-border-dim p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
                  <Settings className="w-5 h-5 text-accent-blue" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-text-main">
                    Engine Configuration
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-text-dim mt-1">
                    {config.name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close configuration"
              >
                <X className="w-5 h-5 text-text-dim" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent-blue" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
                    Performance Parameters
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dim">
                      Performance Threshold (%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.parameters.performanceThreshold}
                      onChange={e =>
                        setConfig(prev => ({
                          ...prev,
                          parameters: {
                            ...prev.parameters,
                            performanceThreshold: parseInt(e.target.value, 10)
                          }
                        }))
                      }
                      className="w-full h-2 rounded-lg accent-accent-blue bg-border-dim"
                    />
                    <div className="text-[11px] font-mono font-black text-accent-blue">
                      {config.parameters.performanceThreshold}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dim">
                      Max Allocation (%)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={config.parameters.maxAllocation}
                      onChange={e =>
                        setConfig(prev => ({
                          ...prev,
                          parameters: {
                            ...prev.parameters,
                            maxAllocation: parseInt(e.target.value, 10)
                          }
                        }))
                      }
                      className="w-full h-2 rounded-lg accent-accent-gold bg-border-dim"
                    />
                    <div className="text-[11px] font-mono font-black text-accent-gold">
                      {config.parameters.maxAllocation}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dim">
                      Risk Profile
                    </label>
                    <select
                      value={config.parameters.riskLevel}
                      onChange={e =>
                        setConfig(prev => ({
                          ...prev,
                          parameters: {
                            ...prev.parameters,
                            riskLevel: e.target.value as any
                          }
                        }))
                      }
                      className="w-full bg-bg border border-border-dim rounded-lg px-3 py-2 text-[10px] font-black text-text-main outline-none focus:border-accent-blue"
                    >
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-dim">
                      Auto Optimize
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.parameters.autoOptimize}
                        onChange={e =>
                          setConfig(prev => ({
                            ...prev,
                            parameters: {
                              ...prev.parameters,
                              autoOptimize: e.target.checked
                            }
                          }))
                        }
                        className="w-4 h-4 accent-accent-blue rounded"
                      />
                      <span className="text-[10px] font-black text-text-dim">
                        Enable automatic optimization
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-accent-gold" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
                    Engine Interactions
                  </h3>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.parameters.enableInteractions}
                      onChange={e =>
                        setConfig(prev => ({
                          ...prev,
                          parameters: {
                            ...prev.parameters,
                            enableInteractions: e.target.checked
                          }
                        }))
                      }
                      className="w-4 h-4 accent-accent-gold rounded"
                    />
                    <span className="text-[10px] font-black text-text-dim">
                      Enable cross-engine interactions
                    </span>
                  </label>

                  {config.parameters.enableInteractions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 ml-4"
                    >
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-dim">
                          Data Flow
                        </label>
                        <select
                          value={config.connections.dataFlow}
                          onChange={e =>
                            setConfig(prev => ({
                              ...prev,
                              connections: {
                                ...prev.connections,
                                dataFlow: e.target.value as any
                              }
                            }))
                          }
                          className="w-full bg-bg border border-border-dim rounded-lg px-3 py-2 text-[10px] font-black text-text-main outline-none focus:border-accent-gold"
                        >
                          <option value="pull">Pull</option>
                          <option value="push">Push</option>
                          <option value="bidirectional">Bidirectional</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-dim">
                          Sync Interval (seconds)
                        </label>
                        <input
                          type="number"
                          min={5}
                          max={300}
                          step={5}
                          value={config.connections.syncInterval}
                          onChange={e =>
                            setConfig(prev => ({
                              ...prev,
                              connections: {
                                ...prev.connections,
                                syncInterval: parseInt(e.target.value, 10)
                              }
                            }))
                          }
                          className="w-full bg-bg border border-border-dim rounded-lg px-3 py-2 text-[10px] font-black text-text-main outline-none focus:border-accent-gold"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-dim">
                          <span>Linked Engines</span>
                          <span>{config.connections.linkedEngines.length} selected</span>
                        </div>

                        {config.connections.linkedEngines.length > 0 && (
                          <div className="space-y-2">
                            {config.connections.linkedEngines.map(linkedId => {
                              const linkedEngine = engines.find((e: any) => e.id === linkedId);
                              return (
                                <div key={linkedId} className="flex items-center justify-between gap-2 bg-accent-gold/5 border border-accent-gold/20 rounded-lg p-2">
                                  <span className="text-[10px] font-black text-text-main truncate">
                                    {linkedEngine?.name || 'Unknown Engine'}
                                  </span>
                                  <button
                                    onClick={() => handleRemoveLinkedEngine(linkedId)}
                                    className="text-red-500 p-1 rounded hover:bg-red-500/10"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {availableEngines.length > 0 && (
                          <select
                            value=""
                            onChange={e => {
                              handleAddLinkedEngine(e.target.value);
                              e.target.value = '';
                            }}
                            className="w-full bg-bg border border-border-dim rounded-lg px-3 py-2 text-[10px] font-black text-text-main outline-none focus:border-accent-gold"
                          >
                            <option value="">Choose an engine...</option>
                            {availableEngines
                              .filter((e: any) => !config.connections.linkedEngines.includes(e.id))
                              .map((e: any) => (
                                <option key={e.id} value={e.id}>
                                  {e.name}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-text-main">
                    Alert Configuration
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border-dim hover:border-accent-blue transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.alerts.enableLowIntegrity}
                      onChange={e =>
                        setConfig(prev => ({
                          ...prev,
                          alerts: {
                            ...prev.alerts,
                            enableLowIntegrity: e.target.checked
                          }
                        }))
                      }
                      className="w-4 h-4 accent-accent-blue rounded"
                    />
                    <span className="text-[10px] font-black text-text-dim">
                      Low integrity alerts
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border-dim hover:border-accent-blue transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.alerts.enableHighPerformance}
                      onChange={e =>
                        setConfig(prev => ({
                          ...prev,
                          alerts: {
                            ...prev.alerts,
                            enableHighPerformance: e.target.checked
                          }
                        }))
                      }
                      className="w-4 h-4 accent-accent-blue rounded"
                    />
                    <span className="text-[10px] font-black text-text-dim">
                      High performance alerts
                    </span>
                  </label>

                  {config.alerts.enableLowIntegrity && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dim">
                        Integrity threshold (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={config.alerts.integrityThreshold}
                        onChange={e =>
                          setConfig(prev => ({
                            ...prev,
                            alerts: {
                              ...prev.alerts,
                              integrityThreshold: parseInt(e.target.value, 10)
                            }
                          }))
                        }
                        className="w-full bg-bg border border-border-dim rounded-lg px-3 py-2 text-[10px] font-black text-text-main outline-none focus:border-accent-blue"
                      />
                    </div>
                  )}

                  {config.alerts.enableHighPerformance && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-dim">
                        Performance threshold (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={config.alerts.performanceThreshold}
                        onChange={e =>
                          setConfig(prev => ({
                            ...prev,
                            alerts: {
                              ...prev.alerts,
                              performanceThreshold: parseInt(e.target.value, 10)
                            }
                          }))
                        }
                        className="w-full bg-bg border border-border-dim rounded-lg px-3 py-2 text-[10px] font-black text-text-main outline-none focus:border-accent-blue"
                      />
                    </div>
                  )}
                </div>
              </section>

              <div className="flex flex-col md:flex-row items-center gap-3 pt-4 border-t border-border-dim">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-accent-blue text-bg font-black uppercase tracking-[0.1em] hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] disabled:opacity-50 transition-all"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Configuration
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-lg border border-border-dim text-text-main font-black uppercase tracking-[0.1em] hover:border-accent-blue hover:text-accent-blue transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
