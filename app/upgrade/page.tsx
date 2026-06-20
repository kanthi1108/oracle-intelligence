'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  tier: string;
  credits: number;
  price: string;
  priceLabel: string;
  features: string[];
  current: boolean;
}

export default function UpgradePage() {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [currentTier, setCurrentTier] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const plans: Plan[] = [
    {
      id: 'spark',
      name: 'SPARK',
      tier: 'spark',
      credits: 150,
      price: 'Free',
      priceLabel: 'Lifetime grant',
      features: [
        '150 evaluation credits',
        'Basic location intelligence',
        'Single user access',
      ],
      current: false,
    },
    {
      id: 'analyst',
      name: 'ANALYST',
      tier: 'analyst',
      credits: 50,
      price: 'Sandbox',
      priceLabel: 'One-time top-up',
      features: [
        '50 additional credits',
        'Advanced variance matrix',
        'PDF report export',
        'Priority support',
      ],
      current: false,
    },
    {
      id: 'enterprise',
      name: 'ENTERPRISE',
      tier: 'enterprise',
      credits: 9999,
      price: 'Unlimited',
      priceLabel: 'Annual subscription',
      features: [
        'Unlimited evaluations',
        'Full platform access',
        'Admin dashboard',
        'Dedicated support',
      ],
      current: false,
    },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/auth/profile');
        if (res.ok) {
          const data = await res.json();
          setBalance(data.balance ?? 0);
          setCurrentTier(data.profile?.subscription_tier ?? 'spark');
        }
      } catch {
        setErrorMsg('Failed to load account data.');
      }
      setLoading(false);
    };
    fetchProfile();
  }, [router, supabase]);

  const handleSandboxPurchase = async () => {
    setPurchasing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    await new Promise(r => setTimeout(r, 1500));

    try {
      const res = await fetch('/api/credits/sandbox-purchase', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        setSuccessMsg('50 credits added to your account.');
      } else {
        setErrorMsg(data.error || 'Purchase failed.');
      }
    } catch {
      setErrorMsg('Network error during purchase.');
    }
    setPurchasing(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] font-mono text-oracle-accent">
        [ LOADING... ]
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] font-mono text-oracle-textPrimary p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12 border-b border-oracle-border pb-6">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-widest uppercase mb-2">Upgrade Plan</h1>
            <p className="text-oracle-textSecondary text-[10px] sm:text-xs uppercase tracking-widest">
              Current Balance: <span className="text-oracle-accent font-bold">{balance ?? 0} credits</span>
              {currentTier ? ` — ${currentTier.toUpperCase()} tier` : ''}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-[10px] sm:text-xs uppercase tracking-widest text-oracle-textSecondary hover:text-oracle-accent transition-colors self-start sm:self-auto"
          >
            [ Return to Workspace ]
          </button>
        </div>

        <div className="bg-oracle-panel border border-oracle-border p-4 sm:p-6 mb-8">
          <div className="text-[10px] font-mono text-oracle-accent uppercase tracking-widest mb-2">
            Sandbox Mode
          </div>
          <p className="text-xs text-oracle-textSecondary leading-relaxed">
            Payments are currently operating in sandbox mode. No real payment will be processed.
            Purchasing a plan adds credits to your account instantly for evaluation purposes.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-[#e84747]/10 border border-[#e84747] text-[#e84747] p-4 text-xs tracking-wider mb-8">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-oracle-accent/10 border border-oracle-accent text-oracle-accent p-4 text-xs tracking-wider mb-8">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {plans.map((plan) => {
            const isCurrent = plan.tier === currentTier;
            const isSpark = plan.tier === 'spark';

            return (
              <div
                key={plan.id}
                className={`bg-oracle-bg border p-6 flex flex-col ${
                  isCurrent ? 'border-oracle-accent' : 'border-oracle-border'
                }`}
              >
                <div className="text-[10px] font-mono text-oracle-textSecondary uppercase tracking-widest mb-1">
                  {isCurrent ? 'Current Plan' : 'Available'}
                </div>
                <h2 className="text-lg font-bold tracking-widest text-oracle-textPrimary mb-1">
                  {plan.name}
                </h2>
                <div className="text-2xl font-bold text-oracle-accent mb-1">
                  {plan.price}
                </div>
                <div className="text-[10px] font-mono text-oracle-textSecondary mb-6">
                  {plan.priceLabel}
                </div>

                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="text-xs text-oracle-textPrimary flex items-start gap-2">
                      <span className="text-oracle-accent">•</span>
                      {feat}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-3 text-center text-[10px] font-mono text-oracle-accent border border-oracle-accent uppercase tracking-widest">
                    Active
                  </div>
                ) : isSpark ? (
                  <div className="w-full py-3 text-center text-[10px] font-mono text-oracle-textSecondary border border-oracle-border uppercase tracking-widest">
                    Included
                  </div>
                ) : (
                  <button
                    onClick={handleSandboxPurchase}
                    disabled={purchasing}
                    className={`w-full py-3 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors ${
                      purchasing
                        ? 'bg-oracle-border text-oracle-textSecondary cursor-not-allowed'
                        : 'bg-oracle-accent text-[#0a0a0a] hover:bg-[#eab02e]'
                    }`}
                  >
                    {purchasing ? 'PROCESSING...' : `PURCHASE ${plan.credits} CREDITS`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-oracle-border pt-6 text-center">
          <p className="text-[10px] font-mono text-oracle-textSecondary">
            Questions? Contact your platform administrator.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-[11px] font-mono tracking-[0.2em] text-oracle-textSecondary hover:text-oracle-accent transition-colors uppercase"
          >
            [ Return to Workspace ]
          </button>
        </div>
      </div>
    </main>
  );
}
