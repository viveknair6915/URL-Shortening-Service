'use client';

import './globals.css'
import { Inter } from 'next/font/google'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import React from 'react'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

const queryClient = new QueryClient()

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <QueryClientProvider client={queryClient}>
                    <div className="min-h-screen bg-background flex flex-col">
                        <header className="border-b">
                            <div className="container flex h-16 items-center px-4">
                                <Link href="/" className="text-xl font-bold tracking-tight">
                                    URL Shortener
                                </Link>
                            </div>
                        </header>
                        <main className="flex-1 container py-8 px-4">
                            {children}
                        </main>
                        <Toaster position="bottom-right" />
                    </div>
                </QueryClientProvider>
            </body>
        </html>
    )
}
