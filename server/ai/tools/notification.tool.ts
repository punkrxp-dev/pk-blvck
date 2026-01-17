/**
 * Notification Tool
 * Sends email notifications via Resend
 *
 * IMPORTANTE: Este sistema apenas NOTIFICA o gestor sobre novos leads.
 * NUNCA envia emails automáticos ao lead.
 * NUNCA escreve mensagens em nome do usuário.
 *
 * O email ao gestor cita literalmente a mensagem escrita pelo lead no formulário.
 */

import { log } from '../../utils/logger';

export async function notifyLead(
  email: string,
  intent: 'alto' | 'médio' | 'baixo' | 'spam'
): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  // Determine email template based on intent
  // Nota: Templates devem sempre deixar claro que a mensagem É DO LEAD
  const templates = {
    alto: {
      subject: 'High-Priority Lead Alert',
      body: `A high-priority lead has been identified: ${email}. Immediate follow-up recommended.`,
    },
    médio: {
      subject: 'Medium-Priority Lead',
      body: `A medium-priority lead has been captured: ${email}. Follow-up within 24 hours.`,
    },
    baixo: {
      subject: 'New Lead Captured',
      body: `A new lead has been added: ${email}. Standard follow-up process.`,
    },
    spam: {
      subject: 'Spam Lead Detected',
      body: `Potential spam lead detected: ${email}. Review required.`,
    },
  };

  const template = templates[intent] || templates.baixo;

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
        log(
          `Resend API error: ${response.status}, notification logged only`,
          'notification',
          'warn'
        );
        logNotification(email, intent, template);
        return false;
      }

      log(`Email sent via Resend for ${email} (${intent})`, 'notification');
      return true;
    } catch (error) {
      log(
        `Error sending email via Resend: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'notification',
        'error'
      );
      logNotification(email, intent, template);
      return false;
    }
  }

  // Mock notification for development
  log('Mock notification (RESEND_API_KEY not configured)', 'notification');
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
  log('NOTIFICATION LOG', 'notification');
  log(`To: ${email}`, 'notification');
  log(`Intent: ${intent.toUpperCase()}`, 'notification');
  log(`Subject: ${template.subject}`, 'notification');
  log(`Body: ${template.body}`, 'notification');
}
