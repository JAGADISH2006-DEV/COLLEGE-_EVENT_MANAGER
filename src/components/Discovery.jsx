import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Zap, ArrowRight, Download, ExternalLink, Sparkles, Filter, Trophy, Users } from 'lucide-react';
import { cn } from '../utils';
import { addEvent, EventType } from '../db';

const Discovery = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [selectedPlatform, setSelectedPlatform] = useState('all');

    const platforms = [
        { id: 'all', name: 'Omni Search', icon: Sparkles },
        { id: 'google', name: 'Google', icon: Globe },
        { id: 'unstop', name: 'Unstop', icon: Zap },
        { id: 'devpost', name: 'Devpost', icon: ExternalLink },
        { id: 'mlh', name: 'MLH', icon: Trophy },
        { id: 'knowafest', name: 'Knowafest', icon: Search },
        { id: 'meetup', name: 'Meetup', icon: Users },
    ];

    // Initial Trending Results
    React.useEffect(() => {
        setResults([
            {
                id: 'trend-1',
                eventName: 'SpaceX Mars Mission Ideathon',
                collegeName: 'Global Space Community',
                eventType: EventType.PAPER_PRESENTATION,
                registrationDeadline: '2024-06-20',
                startDate: '2024-06-25',
                endDate: '2024-06-26',
                prizeAmount: 500000,
                location: 'Online',
                isOnline: true,
                website: 'https://spacex.com/careers',
                platform: 'Google Search',
                description: 'Propose innovative solutions for Mars colonization and habitat building.'
            },
            {
                id: 'trend-2',
                eventName: 'NVIDIA AI Graphics Challenge',
                collegeName: 'NVIDIA Developer Program',
                eventType: EventType.HACKATHON,
                registrationDeadline: '2024-05-30',
                startDate: '2024-06-01',
                endDate: '2024-06-03',
                prizeAmount: 200000,
                location: 'Austin, TX',
                isOnline: false,
                website: 'https://nvidia.com/ai-challenge',
                platform: 'Unstop',
                description: 'Build the next generation of AI-powered graphics engines.'
            }
        ]);
    }, []);

    const handleAIsignSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        // Simulate AI Researching across multiple browsers and platforms
        setTimeout(() => {
            const mockResults = [
                {
                    id: 'ext-1',
                    eventName: 'Global Generative AI Hackathon',
                    collegeName: 'Devpost Community',
                    eventType: EventType.HACKATHON,
                    registrationDeadline: '2024-05-25',
                    startDate: '2024-06-05',
                    endDate: '2024-06-07',
                    prizeAmount: 250000,
                    location: 'Online',
                    isOnline: true,
                    website: 'https://devpost.com/hackathons/global-ai',
                    platform: 'Devpost',
                    description: 'The premier global hackathon for Generative AI applications using LLMs.'
                },
                {
                    id: 'ext-2',
                    eventName: 'Smart India Hackathon 2024',
                    collegeName: 'Ministry of Education',
                    eventType: EventType.HACKATHON,
                    registrationDeadline: '2024-07-15',
                    startDate: '2024-08-20',
                    endDate: '2024-08-22',
                    prizeAmount: 1000000,
                    location: 'Nodal Centers',
                    isOnline: false,
                    website: 'https://sih.gov.in',
                    platform: 'Google Search',
                    description: 'A nationwide initiative to provide students a platform to solve some of the pressing problems we face in our daily lives.'
                },
                {
                    id: 'ext-3',
                    eventName: 'Major League Hacking: Summer 24',
                    collegeName: 'MLH Foundation',
                    eventType: EventType.CONTEST,
                    registrationDeadline: '2024-05-10',
                    startDate: '2024-05-12',
                    endDate: '2024-05-14',
                    prizeAmount: 150000,
                    location: 'Virtual',
                    isOnline: true,
                    website: 'https://mlh.io/seasons/2024/events',
                    platform: 'MLH',
                    description: 'Compete in world-class hackathons and level up your engineering skills.'
                },
                {
                    id: 'ext-4',
                    eventName: 'Silicon Valley Project Expo',
                    collegeName: 'Stanford University',
                    eventType: EventType.PROJECT_EXPO,
                    registrationDeadline: '2024-06-20',
                    startDate: '2024-07-01',
                    endDate: '2024-07-03',
                    prizeAmount: 500000,
                    location: 'Stanford Campus',
                    isOnline: false,
                    website: 'https://stanford.edu/expo',
                    platform: 'Bing Search',
                    description: 'The most prestigious project exhibition in the heart of Silicon Valley.'
                },
                {
                    id: 'ext-5',
                    eventName: 'React India Workshop',
                    collegeName: 'React Community',
                    eventType: EventType.WORKSHOP,
                    registrationDeadline: '2024-05-01',
                    startDate: '2024-05-05',
                    endDate: '2024-05-05',
                    prizeAmount: 0,
                    location: 'Goa',
                    isOnline: false,
                    website: 'https://reactindia.io',
                    platform: 'DuckDuckGo',
                    description: 'Advanced React patterns and performance optimization workshop.'
                }
            ];

            setResults(mockResults.filter(r =>
                (selectedPlatform === 'all' || r.platform.toLowerCase().includes(selectedPlatform)) &&
                (r.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.collegeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.platform.toLowerCase().includes(searchQuery.toLowerCase()))
            ));
            setIsSearching(false);
        }, 2000);
    };

    const handleImport = async (event) => {
        try {
            const { id, platform, ...cleanEvent } = event;
            await addEvent(cleanEvent);
            alert(`Succesfully imported ${event.eventName} to your collection!`);
        } catch (error) {
            console.error('Import error:', error);
        }
    };

    return (
        <div className="pb-20">
            <div className="mb-10 text-center max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest mb-4 border border-indigo-100 dark:border-indigo-900/50 shadow-sm"
                >
                    <Sparkles size={14} />
                    AI Event Discovery Engine
                </motion.div>
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                    Find Your Next <span className="text-indigo-600">Opportunity</span>
                </h1>
                <p className="text-slate-500 font-medium">
                    Our AI scans across major platforms to find the best hackathons, expos, and presentations for you.
                </p>
            </div>

            {/* AI Search Bar */}
            <div className="max-w-3xl mx-auto mb-12">
                <form onSubmit={handleAIsignSearch} className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <Search size={22} strokeWidth={2.5} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search anything: 'Hackathons in Bangalore', 'AI Project Expos'..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-32 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl shadow-indigo-500/5 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 text-lg font-medium transition-all"
                    />
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="absolute right-3 top-2.5 bottom-2.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSearching ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                Discovery
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {/* Platform Filters */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                    {platforms.map((p) => {
                        const Icon = p.icon;
                        return (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPlatform(p.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                                    selectedPlatform === p.id
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/30 scale-105"
                                        : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-indigo-300"
                                )}
                            >
                                <Icon size={16} />
                                {p.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {results.length > 0 ? (
                        results.map((event, idx) => (
                            <motion.div
                                key={event.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.1 }}
                                className="glass-card flex flex-col h-full group border-0 ring-1 ring-slate-100 dark:ring-slate-800 hover:ring-indigo-500/50"
                            >
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={cn(
                                            "flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border",
                                            event.platform.includes('Search') || ['Google', 'Bing', 'DuckDuckGo'].includes(event.platform)
                                                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20"
                                                : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
                                        )}>
                                            {event.platform.includes('Search') || ['Google', 'Bing', 'DuckDuckGo'].includes(event.platform) ? <Globe size={10} /> : <Zap size={10} />}
                                            {event.platform} AI Result
                                        </div>
                                        <a href={event.website} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors">
                                            <ExternalLink size={18} />
                                        </a>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">{event.eventName}</h3>
                                    <p className="text-sm font-semibold text-slate-500 mb-4">{event.collegeName}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 leading-relaxed">
                                        {event.description}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                                        <div>
                                            <span className="block mb-1">Type</span>
                                            <span className="text-slate-900 dark:text-slate-200">{event.eventType}</span>
                                        </div>
                                        <div>
                                            <span className="block mb-1">Deadline</span>
                                            <span className="text-rose-600">{event.registrationDeadline}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
                                    <button
                                        onClick={() => handleImport(event)}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-900 text-indigo-600 border border-indigo-100 dark:border-indigo-900/50 rounded-xl font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                                    >
                                        <Download size={18} />
                                        Import to My Events
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : isSearching ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="glass-card h-80 animate-pulse bg-slate-100 dark:bg-slate-800 border-0" />
                        ))
                    ) : searchQuery && (
                        <div className="col-span-full py-20 text-center">
                            <Zap size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 font-bold text-lg">No New Opportunities Found</p>
                            <p className="text-slate-400 text-sm">Try broadening your search query</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Discovery;
