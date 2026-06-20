'use client';

import React, { useState } from 'react';

interface ShareReportModalProps {
    reportId: string;
    onClose: () => void;
}

export default function ShareReportModal({ reportId, onClose }: ShareReportModalProps) {
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setError(null);
        setMessage(null);

        try {
            const res = await fetch('/api/reports/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_id: reportId,
                    recipient_email: email,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to share report');
            } else {
                setMessage(data.message || 'Report delivery queued successfully.');
                setEmail('');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
            <div className="bg-[#0a0a0a] border border-oracle-border p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-mono text-sm text-oracle-accent font-bold tracking-widest uppercase">
                        Share Report
                    </h2>
                    <button onClick={onClose} className="font-mono text-oracle-textSecondary hover:text-white text-xs">
                        [ CLOSE ]
                    </button>
                </div>

                {message ? (
                    <div>
                        <div className="bg-oracle-accent/10 border border-oracle-accent text-oracle-accent p-3 text-xs tracking-wider mb-4">
                            {message}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full bg-oracle-accent text-oracle-bg font-mono font-bold tracking-widest text-xs py-3 hover:bg-[#eab02e] transition-colors uppercase"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleShare} className="space-y-4">
                        {error && (
                            <div className="bg-[#e84747]/10 border border-[#e84747] text-[#e84747] p-3 text-xs tracking-wider">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] font-mono text-oracle-textSecondary uppercase tracking-wider mb-2">
                                Recipient Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="colleague@company.com"
                                required
                                className="w-full bg-[#111] border border-oracle-border text-sm p-3 focus:outline-none focus:border-oracle-accent transition-colors font-mono"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={sending || !email.trim()}
                            className="w-full bg-oracle-accent text-oracle-bg font-mono font-bold tracking-widest text-xs py-3 hover:bg-[#eab02e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                        >
                            {sending ? 'SENDING...' : 'Send Report'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
