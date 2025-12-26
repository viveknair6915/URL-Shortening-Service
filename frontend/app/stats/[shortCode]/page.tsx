'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getUrlStats, deleteUrl, updateUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function StatsPage() {
    const params = useParams();
    const shortCode = params.shortCode as string;
    const router = useRouter();
    const queryClient = useQueryClient();
    const [newUrl, setNewUrl] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['stats', shortCode],
        queryFn: () => getUrlStats(shortCode),
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteUrl(shortCode),
        onSuccess: () => {
            toast.success('URL deleted');
            router.push('/');
        },
        onError: () => toast.error('Failed to delete URL'),
    });

    const updateMutation = useMutation({
        mutationFn: (url: string) => updateUrl(shortCode, url),
        onSuccess: () => {
            toast.success('URL updated');
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['stats', shortCode] });
        },
        onError: () => toast.error('Failed to update URL'),
    });

    if (isLoading) return <div className="text-center mt-20">Loading stats...</div>;
    if (error) return <div className="text-center mt-20 text-red-500">Error loading stats. ID not found.</div>;

    return (
        <div className="container max-w-2xl mx-auto py-10">
            <div className="mb-6">
                <Link href="/">
                    <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>URL Statistics</CardTitle>
                    <CardDescription>Manage and view stats for your link.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm font-medium text-muted-foreground">Short Code</div>
                            <div className="text-2xl font-bold">{stats.short_code}</div>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm font-medium text-muted-foreground">Total Clicks</div>
                            <div className="text-2xl font-bold">{stats.access_count}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">Destination URL</h3>
                        <div className="flex gap-2">
                            <Input
                                value={isEditing ? newUrl : stats.url}
                                onChange={(e) => setNewUrl(e.target.value)}
                                readOnly={!isEditing}
                                placeholder={stats.url} // Show current as placeholder if editing start empty
                            />
                            {isEditing ? (
                                <Button onClick={() => updateMutation.mutate(newUrl || stats.url)}>
                                    <Save className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button variant="outline" onClick={() => { setIsEditing(true); setNewUrl(stats.url); }}>
                                    Edit
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Created: {new Date(stats.created_at).toLocaleString()}
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="justify-between border-t pt-6 bg-muted/20">
                    <div className="text-xs text-muted-foreground italic">
                        Pro tip: Updates invalidate cache immediately.
                    </div>
                    <Button variant="destructive" onClick={() => {
                        if (confirm('Are you sure you want to delete this link?')) {
                            deleteMutation.mutate();
                        }
                    }}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Link
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

import Link from 'next/link';
