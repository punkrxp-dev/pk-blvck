/**
 * Security Validation Tool
 *
 * Provides enhanced validation and sanitization for personal data and inputs.
 * Includes email validation, data sanitization, and security checks.
 */

import { z } from 'zod';
import { log } from '../../utils/logger';

// ========================================
// EMAIL VALIDATION
// ========================================

/**
 * Known suspicious email domains
 */
const SUSPICIOUS_DOMAINS = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'temp-mail.org',
  'throwaway.email',
  'yopmail.com',
  'maildrop.cc',
  'fakeinbox.com',
  'mail-temporaire.fr',
  'tempail.com',
];

/**
 * Known disposable email domains (subset)
 */
const DISPOSABLE_DOMAINS = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'temp-mail.org',
  'yopmail.com',
];

/**
 * Validate email format and security
 */
export function validateEmailSecurity(email: string): {
  isValid: boolean;
  isDisposable: boolean;
  isSuspicious: boolean;
  domain: string;
  localPart: string;
  issues: string[];
} {
  const issues: string[] = [];
  let isValid = true;
  let isDisposable = false;
  let isSuspicious = false;

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    issues.push('Invalid email format');
    isValid = false;
  }

  const [localPart, domain] = email.toLowerCase().split('@');

  if (!localPart || !domain) {
    issues.push('Missing local part or domain');
    isValid = false;
  } else {
    // Check for suspicious patterns
    if (localPart.length > 64) {
      issues.push('Local part too long');
      isValid = false;
    }

    if (domain.length > 253) {
      issues.push('Domain too long');
      isValid = false;
    }

    // Check for excessive numbers in local part
    if ((localPart.match(/\d/g) || []).length > 5) {
      issues.push('Excessive numbers in local part');
      isSuspicious = true;
    }

    // Check for suspicious characters
    if (/[<>'"&]/.test(localPart)) {
      issues.push('Suspicious characters in local part');
      isSuspicious = true;
    }

    // Check for known disposable domains
    if (DISPOSABLE_DOMAINS.includes(domain)) {
      issues.push('Disposable email domain detected');
      isDisposable = true;
      isSuspicious = true;
    }

    // Check for known suspicious domains
    if (SUSPICIOUS_DOMAINS.includes(domain)) {
      issues.push('Suspicious email domain detected');
      isSuspicious = true;
    }

    // Check for numeric-only domains or suspicious TLDs
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq'];
    if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
      issues.push('Suspicious top-level domain');
      isSuspicious = true;
    }

    // Check for consecutive dots
    if (domain.includes('..') || localPart.includes('..')) {
      issues.push('Consecutive dots detected');
      isValid = false;
    }

    // Check for IP addresses in domain (suspicious)
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipRegex.test(domain)) {
      issues.push('IP address in domain (suspicious)');
      isSuspicious = true;
    }
  }

  return {
    isValid,
    isDisposable,
    isSuspicious,
    domain: domain || '',
    localPart: localPart || '',
    issues,
  };
}

// ========================================
// DATA SANITIZATION
// ========================================

/**
 * Sanitize personal data fields
 */
export function sanitizePersonalData(data: {
  firstName?: string;
  lastName?: string;
  company?: string;
  position?: string;
  phone?: string;
  linkedin?: string;
}): {
  firstName?: string;
  lastName?: string;
  company?: string;
  position?: string;
  phone?: string;
  linkedin?: string;
  sanitized: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const sanitized = { ...data };

  // Sanitize names
  if (data.firstName) {
    const clean = sanitizeName(data.firstName);
    if (clean !== data.firstName) {
      issues.push('First name sanitized');
      sanitized.firstName = clean;
    }
  }

  if (data.lastName) {
    const clean = sanitizeName(data.lastName);
    if (clean !== data.lastName) {
      issues.push('Last name sanitized');
      sanitized.lastName = clean;
    }
  }

  // Sanitize company
  if (data.company) {
    const clean = sanitizeCompany(data.company);
    if (clean !== data.company) {
      issues.push('Company name sanitized');
      sanitized.company = clean;
    }
  }

  // Sanitize position
  if (data.position) {
    const clean = sanitizePosition(data.position);
    if (clean !== data.position) {
      issues.push('Position sanitized');
      sanitized.position = clean;
    }
  }

  // Sanitize phone
  if (data.phone) {
    const clean = sanitizePhone(data.phone);
    if (clean !== data.phone) {
      issues.push('Phone sanitized');
      sanitized.phone = clean;
    }
  }

  // Sanitize LinkedIn
  if (data.linkedin) {
    const clean = sanitizeLinkedIn(data.linkedin);
    if (clean !== data.linkedin) {
      issues.push('LinkedIn URL sanitized');
      sanitized.linkedin = clean;
    }
  }

  return {
    ...sanitized,
    sanitized: issues.length > 0,
    issues,
  };
}

/**
 * Sanitize name fields
 */
function sanitizeName(name: string): string {
  return (
    name
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove brackets specifically
      .replace(/[<>]/g, '')
      // Limit length
      .substring(0, 100)
  );
}

/**
 * Sanitize company names
 */
function sanitizeCompany(company: string): string {
  return (
    company
      .trim()
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove suspicious characters
      .replace(/[<>'"&;]/g, '')
      // Remove potential script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Limit length
      .substring(0, 200)
  );
}

/**
 * Sanitize position titles
 */
function sanitizePosition(position: string): string {
  return (
    position
      .trim()
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove suspicious characters
      .replace(/[<>'"&;]/g, '')
      // Limit length
      .substring(0, 200)
  );
}

/**
 * Sanitize phone numbers
 */
function sanitizePhone(phone: string): string {
  return (
    phone
      .trim()
      // Remove all non-numeric characters except +
      .replace(/[^\d+]/g, '')
      // Limit length
      .substring(0, 20)
  );
}

/**
 * Sanitize LinkedIn URLs
 */
function sanitizeLinkedIn(linkedin: string): string {
  let clean = linkedin.trim().toLowerCase();

  // Remove HTML tags
  clean = clean.replace(/<[^>]*>/g, '');

  // Check if it's a valid LinkedIn URL
  if (!clean.includes('linkedin.com/in/') && !clean.includes('linkedin.com/pub/')) {
    return ''; // Invalid LinkedIn URL
  }

  // Remove suspicious characters
  return clean.replace(/[<>'"&;]/g, '');
}

// ========================================
// CONTENT SECURITY
// ========================================

/**
 * Check for potentially malicious content
 */
export function checkContentSecurity(content: string): {
  isSafe: boolean;
  threats: string[];
  riskLevel: 'low' | 'medium' | 'high';
} {
  const threats: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  const lowerContent = content.toLowerCase();

  // Check for script tags
  if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
    threats.push('Script tags detected');
    riskLevel = 'high';
  }

  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
    /('|(\\x27)|(\\x2D\\x2D)|(#)|(%3B)|(%27))/i,
  ];

  if (sqlPatterns.some(pattern => pattern.test(content))) {
    threats.push('Potential SQL injection patterns');
    riskLevel = 'high';
  }

  // Check for XSS patterns
  const xssPatterns = [
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  if (xssPatterns.some(pattern => pattern.test(content))) {
    threats.push('Potential XSS patterns');
    riskLevel = 'high';
  }

  // Check for spam keywords
  const spamKeywords = [
    'casino',
    'lottery',
    'winner',
    'prize',
    'inheritance',
    'million dollars',
    'bitcoin',
    'crypto investment',
    'pharmacy',
    'viagra',
    'cialis',
    'enlargement',
  ];

  const foundSpam = spamKeywords.filter(keyword => lowerContent.includes(keyword)).sort();
  if (foundSpam.length > 0) {
    threats.push(`Spam keywords detected: ${foundSpam.join(', ')}`);
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }

  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.7 && content.length > 20) {
    threats.push('Excessive capitalization');
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }

  // Check for repetitive characters
  if (/(.)\1{4,}/.test(content)) {
    threats.push('Repetitive characters detected');
    riskLevel = 'medium';
  }

  return {
    isSafe: threats.length === 0,
    threats,
    riskLevel,
  };
}

// ========================================
// ENHANCED ZOD SCHEMAS
// ========================================

/**
 * Enhanced email validation schema
 */
export const secureEmailSchema = z
  .string()
  .min(5, 'Email muito curto')
  .max(254, 'Email muito longo')
  .email('Formato de email inválido')
  .refine(
    email => {
      const validation = validateEmailSecurity(email);
      return validation.isValid;
    },
    {
      message: 'Email contém caracteres ou formato inválido',
    }
  )
  .refine(
    email => {
      const validation = validateEmailSecurity(email);
      return !validation.isDisposable;
    },
    {
      message: 'Emails temporários não são permitidos',
    }
  );

/**
 * Secure personal data schema
 */
export const securePersonalDataSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'Nome é obrigatório')
      .max(100, 'Nome muito longo')
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome contém caracteres inválidos')
      .optional(),

    lastName: z
      .string()
      .min(1, 'Sobrenome é obrigatório')
      .max(100, 'Sobrenome muito longo')
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Sobrenome contém caracteres inválidos')
      .optional(),

    company: z
      .string()
      .max(200, 'Nome da empresa muito longo')
      .regex(/^[^<>'"&;]*$/, 'Nome da empresa contém caracteres inválidos')
      .optional(),

    position: z
      .string()
      .max(200, 'Cargo muito longo')
      .regex(/^[^<>'"&;]*$/, 'Cargo contém caracteres inválidos')
      .optional(),

    phone: z
      .string()
      .regex(/^[\d+\s-()]+$/, 'Telefone contém caracteres inválidos')
      .max(20, 'Telefone muito longo')
      .optional(),

    linkedin: z
      .string()
      .url('LinkedIn deve ser uma URL válida')
      .refine(url => url.includes('linkedin.com'), 'URL deve ser do LinkedIn')
      .optional(),
  })
  .strict();

// ========================================
// INTEGRATION HELPERS
// ========================================

/**
 * Comprehensive input validation for agents
 */
export function validateAgentInput(input: {
  email: string;
  message?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  position?: string;
  phone?: string;
  linkedin?: string;
}): {
  isValid: boolean;
  sanitized: typeof input;
  issues: string[];
  security: {
    emailSecurity: ReturnType<typeof validateEmailSecurity>;
    contentSecurity: ReturnType<typeof checkContentSecurity>;
  };
} {
  const issues: string[] = [];
  const sanitized = { ...input };

  // Validate email security
  const emailSecurity = validateEmailSecurity(input.email);
  if (!emailSecurity.isValid) {
    issues.push(...emailSecurity.issues);
  }
  if (emailSecurity.isSuspicious) {
    issues.push('Email suspeito detectado');
  }

  // Sanitize personal data
  const personalFields = {
    firstName: input.firstName,
    lastName: input.lastName,
    company: input.company,
    position: input.position,
    phone: input.phone,
    linkedin: input.linkedin,
  };

  const sanitizedData = sanitizePersonalData(personalFields);
  if (sanitizedData.sanitized) {
    issues.push(...sanitizedData.issues);
  }

  // Update sanitized object
  Object.assign(sanitized, sanitizedData);

  // Check content security
  let contentSecurity: ReturnType<typeof checkContentSecurity> = {
    isSafe: true,
    threats: [],
    riskLevel: 'low',
  };
  if (input.message) {
    contentSecurity = checkContentSecurity(input.message);
    if (!contentSecurity.isSafe) {
      issues.push(...contentSecurity.threats);
    }
  }

  // Validate with enhanced schemas
  try {
    secureEmailSchema.parse(input.email);
  } catch (error) {
    if (error instanceof z.ZodError) {
      issues.push(...error.errors.map(e => e.message));
    }
  }

  try {
    securePersonalDataSchema.parse(personalFields);
  } catch (error) {
    if (error instanceof z.ZodError) {
      issues.push(...error.errors.map(e => `Dados pessoais: ${e.message}`));
    }
  }

  return {
    isValid: issues.length === 0,
    sanitized,
    issues,
    security: {
      emailSecurity,
      contentSecurity,
    },
  };
}

export { log };
