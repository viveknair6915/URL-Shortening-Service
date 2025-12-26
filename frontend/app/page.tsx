"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { shortenUrl } from "@/lib/api";
import { Background } from "@/components/Background";
import { ArrowRight, Link as LinkIcon, Sparkles } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface RecentLink {
    code: string;
    original: string;
    timestamp: number;
}

export default function Home() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [recentLinks, setRecentLinks] = useState<RecentLink[]>([]);
    const router = useRouter();

    // Load history on mount
    useEffect(() => {
        const saved = localStorage.getItem("url_history");
        if (saved) {
            setRecentLinks(JSON.parse(saved).slice(0, 5));
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        try {
            const data = await shortenUrl(url);

            // Save to history
            const newEntry = { code: data.short_code, original: data.url, timestamp: Date.now() };
            const updatedHistory = [newEntry, ...recentLinks.filter(l => l.code !== data.short_code)].slice(0, 5);
            setRecentLinks(updatedHistory);
            localStorage.setItem("url_history", JSON.stringify(updatedHistory));

            router.push(`/result/${data.short_code}`);
        } catch (error) {
            console.error("Failed to shorten", error);
            toast.error("Failed to shorten URL. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <Background />
            <Toaster position="bottom-center" toastOptions={{
                style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '10px',
                }
            }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-2xl z-10 text-center"
            >
                {/* Header */}
                <div className="mb-12 space-y-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-6"
                    >
                        <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                        <span className="text-sm font-medium text-purple-200 uppercase tracking-widest">Next-Gen Link Shortener</span>
                    </motion.div>

                    <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
                        Shorten Links <br />
                        <span className="text-gradient hover:blur-[2px] transition-all duration-300">Like a Pro.</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-lg mx-auto leading-relaxed">
                        Transform long, ugly URLs into sleek, trackable short links.
                        Powered by modern infrastructure for lightning-fast redirects.
                    </p>
                </div>

                {/* Input Form */}
                <div className="glass-panel p-2 rounded-2xl flex items-center gap-2 focus-within:ring-2 focus-within:ring-purple-500/50 transition-all shadow-[0_0_50px_rgba(120,50,255,0.15)]">
                    <div className="pl-4 text-gray-400">
                        <LinkIcon className="w-5 h-5" />
                    </div>
                    <input
                        type="url"
                        placeholder="Paste your long URL here..."
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 h-14 text-lg"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="h-12 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 shadow-lg shadow-purple-500/20"
                    >
                        {loading ? (
                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                        ) : (
                            <>
                                Shorten <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>

                {/* Recent History */}
                <AnimatePresence>
                    {recentLinks.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-12 w-full text-left"
                        >
                            <h3 className="text-sm font-semibold text-gray-500 mb-4 px-2 uppercase tracking-wider">Recent Links</h3>
                            <div className="space-y-3">
                                {recentLinks.map((link) => (
                                    <motion.div
                                        key={link.code}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="glass-panel p-4 rounded-xl flex items-center justify-between group hover:bg-white/5 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/result/${link.code}`)}
                                    >
                                        <div className="flex flex-col truncate pr-4">
                                            <span className="text-purple-400 font-medium truncate">{window.location.host}/{link.code}</span>
                                            <span className="text-gray-500 text-xs truncate max-w-[300px]">{link.original}</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        </main>
    );
}
