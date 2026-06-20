import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-oracle-textPrimary font-mono flex flex-col">
            <header className="h-14 border-b border-oracle-border flex items-center px-6">
                <Link href="/login" className="text-[10px] tracking-widest text-oracle-textSecondary hover:text-oracle-accent transition-colors uppercase">
                    ← BACK TO LOGIN
                </Link>
            </header>
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
                <h1 className="text-xl font-bold tracking-wider mb-8 text-oracle-accent">TERMS OF SERVICE</h1>
                <div className="space-y-6 text-[13px] leading-relaxed text-oracle-textSecondary">
                    <p><strong className="text-oracle-textPrimary">Effective Date:</strong> June 20, 2026</p>
                    <p>
                        By accessing or using the ATLASIQ platform, you agree to be bound by these Terms of Service.
                    </p>
                    <h2 className="text-oracle-textPrimary font-bold tracking-wider mt-8">1. Account Registration</h2>
                    <p>
                        You must provide accurate information when creating an account. You are responsible
                        for maintaining the confidentiality of your credentials and for all activity under
                        your account.
                    </p>
                    <h2 className="text-oracle-textPrimary font-bold tracking-wider mt-8">2. Acceptable Use</h2>
                    <p>
                        You agree to use the platform only for lawful purposes and in accordance with these
                        terms. You may not use the platform to infringe on others&apos; rights or to distribute
                        malicious content.
                    </p>
                    <h2 className="text-oracle-textPrimary font-bold tracking-wider mt-8">3. Intellectual Property</h2>
                    <p>
                        The platform, including its content, features, and functionality, is owned by ATLASIQ
                        and is protected by applicable intellectual property laws.
                    </p>
                    <h2 className="text-oracle-textPrimary font-bold tracking-wider mt-8">4. Limitation of Liability</h2>
                    <p>
                        ATLASIQ provides the platform on an &ldquo;as is&rdquo; basis. We make no warranties regarding
                        the accuracy or completeness of analysis results. You use the platform at your own risk.
                    </p>
                    <h2 className="text-oracle-textPrimary font-bold tracking-wider mt-8">5. Contact</h2>
                    <p>
                        For questions about these terms, contact us at legal@atlasiq.com.
                    </p>
                </div>
            </main>
            <footer className="border-t border-oracle-border py-4 text-center text-[10px] text-oracle-textSecondary tracking-widest">
                ATLASIQ LOCATION INTELLIGENCE PLATFORM
            </footer>
        </div>
    );
}
