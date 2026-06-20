import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-oracle-textPrimary font-mono flex flex-col">
            <header className="h-14 border-b border-oracle-border flex items-center px-6">
                <Link href="/login" className="text-[10px] tracking-widest text-oracle-textSecondary hover:text-oracle-accent transition-colors uppercase">
                    ← BACK TO LOGIN
                </Link>
            </header>
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
                <h1 className="text-xl font-bold tracking-wider mb-8 text-oracle-accent">PRIVACY POLICY</h1>
                <div className="space-y-6 text-[13px] leading-relaxed text-oracle-textSecondary">
                    <p><strong className="text-oracle-textPrimary">Effective Date:</strong> June 20, 2026</p>
                    <p>
                        This Privacy Policy describes how ATLASIQ collects, uses, and discloses your information
                        when you use our platform.
                    </p>
                    <h2 className="text-oracle-textPrimary font-bold tracking-wider mt-8">1. Information We Collect</h2>
                    <p>
                        We collect information you provide directly, such as your name, email address, and
                        organization details when you register for an account. We also collect usage data,
                        including location queries and analysis parameters, to improve our services.
                    </p>
                    <h2 className="text-oracle-textPrimary font-bold tracking-wider mt-8">2. How We Use Your Information</h2>
                    <p>
                        We use your information to provide, maintain, and improve our location intelligence
                        platform; to process your analysis requests; to send technical notices and support
                        messages; and to communicate with you about your account.
                    </p>
                    <h2 className="text-oracle-textPrimary font-bold tracking-wider mt-8">3. Data Sharing</h2>
                    <p>
                        We do not sell your personal information. We may share data with service providers
                        who assist in operating our platform, subject to confidentiality agreements.
                    </p>
                    <h2 className="text-oracle-textPrimary font-bold tracking-wider mt-8">4. Data Retention</h2>
                    <p>
                        We retain your account information for as long as your account is active. Analysis
                        results are retained in accordance with your subscription plan.
                    </p>
                    <h2 className="text-oracle-textPrimary font-bold tracking-wider mt-8">5. Contact</h2>
                    <p>
                        For questions about this policy, contact us at privacy@atlasiq.com.
                    </p>
                </div>
            </main>
            <footer className="border-t border-oracle-border py-4 text-center text-[10px] text-oracle-textSecondary tracking-widest">
                ATLASIQ LOCATION INTELLIGENCE PLATFORM
            </footer>
        </div>
    );
}
