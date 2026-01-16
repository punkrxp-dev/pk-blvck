
/**
 * Notification Tool
 * Sends email notifications via Resend
 */

export async function notifyLead(
    email: string,
    intent: 'high' | 'medium' | 'low' | 'spam'
): Promise<boolean> {
    const resendApiKey = process.env.RESEND_API_KEY;

    // Determine email template based on intent
    const templates = {
        high: {
            subject: '🎯 High-Priority Lead Alert',
            body: `A high-priority lead has been identified: ${email}. Immediate follow-up recommended.`,
        },
        medium: {
            subject: '📊 Medium-Priority Lead',
            body: `A medium-priority lead has been captured: ${email}. Follow-up within 24 hours.`,
        },
        low: {
            subject: '📝 New Lead Captured',
            body: `A new lead has been added: ${email}. Standard follow-up process.`,
        },
        spam: {
            subject: '🚫 Spam Lead Detected',
            body: `Potential spam lead detected: ${email}. Review required.`,
        },
    };

    const template = templates[intent] || templates.low;

    // If Resend API key is configured, send real email
    if (resendApiKey) {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${resendApiKey}`,
                },
                body: JSON.stringify({
                    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
                    to: process.env.NOTIFICATION_EMAIL || 'admin@example.com',
                    subject: template.subject,
                    html: `<p>${template.body}</p>`,
                }),
            });

            if (!response.ok) {
                console.warn(`Resend API error: ${response.status}, notification logged only`);
                logNotification(email, intent, template);
                return false;
            }

            console.log(`📧 Email sent via Resend for ${email} (${intent})`);
            return true;
        } catch (error) {
            console.error('Error sending email via Resend:', error);
            logNotification(email, intent, template);
            return false;
        }
    }

    // Mock notification for development
    console.log('🔧 Mock notification (RESEND_API_KEY not configured)');
    logNotification(email, intent, template);
    return true;
}

/**
 * Logs notification to console (fallback)
 */
function logNotification(
    email: string,
    intent: string,
    template: { subject: string; body: string }
) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 NOTIFICATION LOG');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${email}`);
    console.log(`Intent: ${intent.toUpperCase()}`);
    console.log(`Subject: ${template.subject}`);
    console.log(`Body: ${template.body}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
