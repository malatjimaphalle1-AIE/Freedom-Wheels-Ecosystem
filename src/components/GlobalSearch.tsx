import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Loader2, Target, User, Cpu, Book, ArrowRight } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { sections } from '../pages/KnowledgeBase';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'LEAD' | 'CAMPAIGN' | 'ENGINE' | 'KNOWLEDGE';
  link: string;
  icon: React.ReactNode;
}

export default function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchTerm('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(); // Toggle behavior if needed, but App will handle open/close
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        performSearch(searchTerm.trim());
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const performSearch = async (term: string) => {
    if (!user) return;
    setIsSearching(true);
    const lowercaseTerm = term.toLowerCase();
    
    try {
      const searchResults: SearchResult[] = [];

      // 1. Search Leads (by name or email)
      const leadsQ = query(
        collection(db, 'leads'),
        where('userId', '==', user.uid),
        limit(5)
      );
      const leadSnap = await getDocs(leadsQ);
      leadSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.name?.toLowerCase().includes(lowercaseTerm) || data.email?.toLowerCase().includes(lowercaseTerm)) {
          searchResults.push({
            id: doc.id,
            title: data.name || 'Unknown Lead',
            subtitle: data.email || 'No email',
            type: 'LEAD',
            link: '/leads',
            icon: <User className="w-4 h-4" />
          });
        }
      });

      // 2. Search Campaigns
      const campaignQ = query(
        collection(db, 'campaigns'),
        where('userId', '==', user.uid),
        limit(5)
      );
      const campaignSnap = await getDocs(campaignQ);
      campaignSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.name?.toLowerCase().includes(lowercaseTerm)) {
          searchResults.push({
            id: doc.id,
            title: data.name,
            subtitle: 'Campaign Protocol',
            type: 'CAMPAIGN',
            link: '/leads',
            icon: <Target className="w-4 h-4" />
          });
        }
      });

      // 3. Search Engines
      const enginesQ = query(
        collection(db, 'engines'),
        where('userId', '==', user.uid),
        limit(5)
      );
      const engineSnap = await getDocs(enginesQ);
      engineSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.name?.toLowerCase().includes(lowercaseTerm)) {
          searchResults.push({
            id: doc.id,
            title: data.name,
            subtitle: 'Revenue Engine',
            type: 'ENGINE',
            link: `/builder?id=${doc.id}`,
            icon: <Cpu className="w-4 h-4" />
          });
        }
      });

      // 4. Search Knowledge Base
      sections.forEach(section => {
        section.articles.forEach(article => {
          if (
            article.title.toLowerCase().includes(lowercaseTerm) || 
            article.content.toLowerCase().includes(lowercaseTerm)
          ) {
            searchResults.push({
              id: article.id,
              title: article.title,
              subtitle: 'Knowledge Protocol',
              type: 'KNOWLEDGE',
              link: '/knowledge',
              icon: <Book className="w-4 h-4" />
            });
          }
        });
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Search failure:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (link: string) => {
    navigate(link);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-surface border border-border-dim rounded-2xl shadow-2xl overflow-hidden relative z-10"
          >
            <div className="p-6 border-b border-border-dim flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-bg border border-border-dim flex items-center justify-center text-accent-blue">
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search across sovereign infrastructure... (Esc to close)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-text-main placeholder:text-text-dim/50"
              />
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-bg flex items-center justify-center text-text-dim hover:text-text-main transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {searchTerm === '' ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-bg border border-border-dim flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-text-dim opacity-20" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-text-dim tracking-widest">Awaiting Command Input</p>
                  <p className="text-[9px] font-mono text-text-dim mt-2 opacity-50">Enter search parameters to reveal node coordinates.</p>
                </div>
              ) : results.length > 0 ? (
                <div className="p-2">
                  {results.map((result, idx) => (
                    <button
                      key={`${result.type}-${result.id}-${idx}`}
                      onClick={() => handleSelect(result.link)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-bg rounded-xl transition-all group text-left"
                    >
                      <div className="w-10 h-10 rounded bg-bg border border-border-dim flex items-center justify-center text-accent-blue group-hover:border-accent-blue/50 transition-colors">
                        {result.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] font-black uppercase tracking-tight text-text-main group-hover:text-accent-blue transition-colors">{result.title}</div>
                        <div className="text-[9px] font-mono text-text-dim uppercase tracking-tighter">{result.subtitle}</div>
                      </div>
                      <div className="px-2 py-1 rounded bg-bg border border-border-dim text-[8px] font-black uppercase text-text-dim group-hover:text-accent-blue group-hover:border-accent-blue/30 transition-all opacity-0 group-hover:opacity-100">
                        Navigate
                      </div>
                      <ArrowRight className="w-4 h-4 text-text-dim opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  {!isSearching && (
                    <>
                      <div className="text-[10px] font-black uppercase text-text-dim tracking-widest">Zero Matches Found</div>
                      <p className="text-[9px] font-mono text-text-dim mt-2 opacity-50">No active nodes matching "{searchTerm}" detected in system memory.</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-bg/50 border-t border-border-dim flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-bg border border-border-dim text-[8px] font-mono text-text-dim font-black">ESC</kbd>
                  <span className="text-[8px] font-black uppercase text-text-dim tracking-widest">Close</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-bg border border-border-dim text-[8px] font-mono text-text-dim font-black">ENTER</kbd>
                  <span className="text-[8px] font-black uppercase text-text-dim tracking-widest">Select</span>
                </div>
              </div>
              <div className="text-[8px] font-black uppercase text-accent-blue tracking-widest opacity-50">
                Sovereign_Search_v1.0
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
