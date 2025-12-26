"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Background } from "@/components/Background";
import { Copy, ArrowLeft, BarChart2, Share2, Check } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function ResultPage() {
    const params = useParams();
    const shortCode = params.shortCode as string;
    const [shortUrl, setShortUrl] = useState("");
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            setShortUrl(`${window.location.protocol}//${window.location.hostname}:8000/${shortCode}`);
        }
    }, [shortCode]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <Background />
            <Toaster position="bottom-center" toastOptions={{
                style: { background: '#333', color: '#fff' }
            }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="glass-panel p-8 rounded-3xl text-center space-y-8 relative overflow-hidden">
                    {/* Absolute Glow Background */}
                    <div className="absolute top-0 left-0 w-full h-2 rounded-t-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />

                    <div className="space-y-2">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h1 className="text-3xl font-bold text-white">Your Link is Ready! 🚀</h1>
                            <p className="text-gray-400">Share it with the world.</p>
                        </motion.div>
                    </div>

                    {/* QR Code */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.3 }}
                        className="flex justify-center"
                    >
                        <div className="p-4 bg-white rounded-xl shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                            <QRCodeSVG
                                value={shortUrl || "https://example.com"}
                                size={180}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                    </motion.div>

                    {/* Link Box */}
                    <div className="space-y-4">
                        <div className="glass-panel p-2 rounded-xl flex items-center gap-2 pr-2">
                            <input
                                readOnly
                                value={shortUrl}
                                className="flex-1 bg-transparent border-none outline-none text-purple-300 font-mono text-sm px-3"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                            >
                                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => router.push(`/stats/${shortCode}`)}
                                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium border border-white/5 hover:border-purple-500/30"
                            >
                                <BarChart2 className="w-4 h-4" /> Statistics
                            </button>
                            <button
                                onClick={() => router.push("/")}
                                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium border border-white/5 hover:border-blue-500/30"
                            >
                                <ArrowLeft className="w-4 h-4" /> New Link
                            </button>
                        </div>
                    </div>

                </div>
            </motion.div>
        </main>
    );
}
