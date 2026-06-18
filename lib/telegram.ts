// lib/telegram.ts
// ORACLE Telegram Bot Lifecycle Notification System — PRD §5.5
// Server-side only. Bot token never exposed to client.
// Dispatches lifecycle events via HTTPS to the Telegram Bot API.

import { createServiceRoleClient } from '@/lib/supabase/server';

// ── CONSTANTS ───────────────────────────────────────────────────

const TELEGRAM_API = 'https://api.telegram.org/bot';

// ── EVENT TYPE DEFINITIONS ──────────────────────────────────────

export type LifecycleEvent =
    | 'REPORT_GENERATED'
    | 'CREDIT_LOW'
    | 'CREDIT_EXHAUSTED'
    | 'SUBSCRIPTION_ACTIVATED'
    | 'SUBSCRIPTION_EXPIRING'
    | 'SUBSCRIPTION_CANCELLED'
    | 'ADMIN_CREDIT_GRANT';

export interface LifecycleContext {
    BUSINESS_TYPE?: string;
    LOC_A?: string;
    LOC_B?: string;
    WINNER?: string;
    CONFIDENCE?: string | number;
    BALANCE?: string | number;
    AMOUNT?: string | number;
    END_DATE?: string;
    UPGRADE_URL?: string;
    RENEW_URL?: string;
}

// ── CORE SEND FUNCTION ──────────────────────────────────────────

export async function sendTelegramNotification(
    chatId: number,
    message: string,
    parseMode: 'Markdown' | 'HTML' = 'Markdown'
): Promise<{ success: boolean; error?: string }> {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
        console.warn('[TELEGRAM] TELEGRAM_BOT_TOKEN not configured — skipping notification');
        return { success: false, error: 'Bot token not configured' };
    }

    try {
        const response = await fetch(
            `${TELEGRAM_API}${token}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: parseMode,
                    disable_web_page_preview: true,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('[TELEGRAM] Dispatch failed:', error);
            return { success: false, error: error.description };
        }

        console.log(`[TELEGRAM] ✓ Notification sent to chat ${chatId}`);
        return { success: true };
    } catch (error) {
        console.error('[TELEGRAM] Network error:', error);
        return { success: false, error: String(error) };
    }
}

// ── NOTIFICATION MESSAGE BUILDER — PRD §5.5 EVENT MAP ───────────

function buildNotificationMessage(
    event: LifecycleEvent,
    ctx: LifecycleContext
): string {
    const upgradeUrl = ctx.UPGRADE_URL ?? 'https://oracle-intelligence.vercel.app/upgrade';
    const renewUrl = ctx.RENEW_URL ?? 'https://oracle-intelligence.vercel.app/upgrade';

    switch (event) {
        case 'REPORT_GENERATED':
            return [
                `📊 *Report Ready*`,
                ``,
                `Your ${ctx.BUSINESS_TYPE} analysis of *${ctx.LOC_A}* vs *${ctx.LOC_B}* is complete.`,
                ``,
                `🏆 Winner: *${ctx.WINNER}*`,
                `Confidence: ${ctx.CONFIDENCE}%`,
                ``,
                `Credits remaining: *${ctx.BALANCE}*`,
            ].join('\n');

        case 'CREDIT_LOW':
            return [
                `⚠️ *Low Credits Alert*`,
                ``,
                `You have *${ctx.BALANCE}* credit(s) remaining on your ORACLE account.`,
                ``,
                `Upgrade to Analyst for 15 credits/month: ${upgradeUrl}`,
            ].join('\n');

        case 'CREDIT_EXHAUSTED':
            return [
                `🚫 *Credits Exhausted*`,
                ``,
                `You've used all your ORACLE credits.`,
                ``,
                `→ Upgrade to Analyst (₹499/month) to continue: ${upgradeUrl}`,
            ].join('\n');

        case 'SUBSCRIPTION_ACTIVATED':
            return [
                `✅ *Subscription Active*`,
                ``,
                `Welcome to ORACLE Analyst!`,
                ``,
                `15 fresh credits are ready.`,
                `Your billing cycle ends: ${ctx.END_DATE ?? 'TBD'}`,
            ].join('\n');

        case 'SUBSCRIPTION_EXPIRING':
            return [
                `🔔 *Subscription Expiring Soon*`,
                ``,
                `Your ORACLE Analyst subscription expires in 3 days (${ctx.END_DATE ?? 'TBD'}).`,
                ``,
                `Renew to keep your 15 monthly credits: ${renewUrl}`,
            ].join('\n');

        case 'SUBSCRIPTION_CANCELLED':
            return [
                `📭 *Subscription Cancelled*`,
                ``,
                `Your ORACLE Analyst subscription has been cancelled.`,
                ``,
                `You can still access reports you've generated. Your account reverts to Spark (3 lifetime credits).`,
            ].join('\n');

        case 'ADMIN_CREDIT_GRANT':
            return [
                `🎁 *Credits Added*`,
                ``,
                `An administrator has added *${ctx.AMOUNT}* credit(s) to your account.`,
                ``,
                `New balance: *${ctx.BALANCE}*`,
            ].join('\n');
    }
}

// ── LIFECYCLE EVENT DISPATCHER ──────────────────────────────────
// Resolves user's telegram_chat_id from database, builds message, sends.
// Fails silently if user hasn't linked Telegram (non-blocking).

export async function dispatchLifecycleEvent(
    userId: string,
    event: LifecycleEvent,
    context: LifecycleContext
): Promise<void> {
    try {
        const supabase = createServiceRoleClient();

        // Fetch user's telegram_chat_id
        const { data: user } = await supabase
            .from('users')
            .select('telegram_chat_id, display_name')
            .eq('id', userId)
            .single();

        if (!user?.telegram_chat_id) return; // User hasn't linked Telegram — skip silently

        const message = buildNotificationMessage(event, context);
        await sendTelegramNotification(user.telegram_chat_id, message);
    } catch (error) {
        // Telegram notifications are non-critical — never block the calling flow
        console.error(`[TELEGRAM] dispatchLifecycleEvent(${event}) failed:`, error);
    }
}
