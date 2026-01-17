import {
  validateEmailSecurity,
  sanitizePersonalData,
  checkContentSecurity,
  validateAgentInput,
  secureEmailSchema,
  securePersonalDataSchema,
} from '../../server/ai/tools/validation.tool';

describe('Email Security Validation', () => {
  describe('validateEmailSecurity', () => {
    it('should validate a clean email', () => {
      const result = validateEmailSecurity('user@company.com');

      expect(result.isValid).toBe(true);
      expect(result.isDisposable).toBe(false);
      expect(result.isSuspicious).toBe(false);
      expect(result.domain).toBe('company.com');
      expect(result.localPart).toBe('user');
      expect(result.issues).toHaveLength(0);
    });

    it('should detect disposable email domains', () => {
      const result = validateEmailSecurity('test@10minutemail.com');

      expect(result.isValid).toBe(true);
      expect(result.isDisposable).toBe(true);
      expect(result.isSuspicious).toBe(true);
      expect(result.issues).toContain('Disposable email domain detected');
    });

    it('should detect suspicious email patterns', () => {
      const result = validateEmailSecurity('test@temp-mail.org');

      expect(result.isValid).toBe(true);
      expect(result.isDisposable).toBe(true);
      expect(result.isSuspicious).toBe(true);
    });

    it('should reject invalid email formats', () => {
      const result = validateEmailSecurity('invalid-email');

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Invalid email format');
    });

    it('should detect consecutive dots', () => {
      const result = validateEmailSecurity('user..test@domain.com');

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Consecutive dots detected');
    });

    it('should detect excessive numbers', () => {
      const result = validateEmailSecurity('user123456789@domain.com');

      expect(result.isValid).toBe(true);
      expect(result.isSuspicious).toBe(true);
    });
  });

  describe('secureEmailSchema', () => {
    it('should validate clean emails', () => {
      expect(() => secureEmailSchema.parse('user@company.com')).not.toThrow();
    });

    it('should reject disposable emails', () => {
      expect(() => secureEmailSchema.parse('test@10minutemail.com')).toThrow();
    });

    it('should reject invalid formats', () => {
      expect(() => secureEmailSchema.parse('invalid')).toThrow();
    });
  });
});

describe('Personal Data Sanitization', () => {
  describe('sanitizePersonalData', () => {
    it('should sanitize names with special characters', () => {
      const input = {
        firstName: 'João<script>alert("xss")</script>',
        lastName: 'Silva',
      };

      const result = sanitizePersonalData(input);

      expect(result.firstName).toBe('Joãoalert("xss")');
      expect(result.lastName).toBe('Silva');
      expect(result.sanitized).toBe(true);
      expect(result.issues).toContain('First name sanitized');
    });

    it('should handle undefined fields', () => {
      const result = sanitizePersonalData({});

      expect(result.firstName).toBeUndefined();
      expect(result.sanitized).toBe(false);
      expect(result.issues).toHaveLength(0);
    });

    it('should sanitize phone numbers', () => {
      const input = { phone: '+55 (11) 99999-9999<script>' };

      const result = sanitizePersonalData(input);

      expect(result.phone).toBe('+5511999999999');
      expect(result.sanitized).toBe(true);
    });

    it('should sanitize LinkedIn URLs', () => {
      const input = { linkedin: 'https://linkedin.com/in/john-doe<script>' };

      const result = sanitizePersonalData(input);

      expect(result.linkedin).toBe('https://linkedin.com/in/john-doe');
      expect(result.sanitized).toBe(true);
    });
  });
});

describe('Content Security', () => {
  describe('checkContentSecurity', () => {
    it('should pass clean content', () => {
      const result = checkContentSecurity('Hello, this is a normal message about our services.');

      expect(result.isSafe).toBe(true);
      expect(result.threats).toHaveLength(0);
      expect(result.riskLevel).toBe('low');
    });

    it('should detect script tags', () => {
      const result = checkContentSecurity('<script>alert("xss")</script> Hello world');

      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('Script tags detected');
      expect(result.riskLevel).toBe('high');
    });

    it('should detect SQL injection patterns', () => {
      const result = checkContentSecurity('SELECT * FROM users WHERE id = 1');

      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('Potential SQL injection patterns');
      expect(result.riskLevel).toBe('high');
    });

    it('should detect spam keywords', () => {
      const result = checkContentSecurity('Win a bitcoin lottery prize!');

      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('Spam keywords detected: bitcoin, lottery, prize');
      expect(result.riskLevel).toBe('medium');
    });

    it('should detect excessive caps', () => {
      const result = checkContentSecurity('THIS IS ALL CAPS TEXT THAT IS TOO LONG TO BE NORMAL CONVERSATION');

      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('Excessive capitalization');
      expect(result.riskLevel).toBe('medium');
    });

    it('should detect repetitive characters', () => {
      const result = checkContentSecurity('Hellooooooo worlddddd!!!!!');

      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('Repetitive characters detected');
      expect(result.riskLevel).toBe('medium');
    });
  });
});

describe('Agent Input Validation', () => {
  describe('validateAgentInput', () => {
    it('should validate clean input', () => {
      const input = {
        email: 'user@company.com',
        message: 'Hello, I am interested in your services.',
        firstName: 'John',
        lastName: 'Doe',
        company: 'ACME Corp',
      };

      const result = validateAgentInput(input);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.security.emailSecurity.isValid).toBe(true);
      expect(result.security.contentSecurity.isSafe).toBe(true);
    });

    it('should reject suspicious email', () => {
      const input = {
        email: 'test@10minutemail.com',
        message: 'Hello',
      };

      const result = validateAgentInput(input);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Emails temporários não são permitidos');
      expect(result.security.emailSecurity.isDisposable).toBe(true);
    });

    it('should reject malicious content', () => {
      const input = {
        email: 'user@company.com',
        message: '<script>alert("xss")</script> Hello world',
      };

      const result = validateAgentInput(input);

      expect(result.isValid).toBe(false);
      expect(result.security.contentSecurity.isSafe).toBe(false);
    });

    it('should handle partial input', () => {
      const input = {
        email: 'user@company.com',
      };

      const result = validateAgentInput(input);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual(input);
    });
  });
});

describe('Zod Schemas', () => {
  describe('securePersonalDataSchema', () => {
    it('should validate clean personal data', () => {
      const data = {
        firstName: 'João',
        lastName: 'Silva',
        company: 'Empresa Ltda',
        position: 'Gerente',
        phone: '+5511999999999',
        linkedin: 'https://linkedin.com/in/joao-silva',
      };

      expect(() => securePersonalDataSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid names', () => {
      const data = {
        firstName: 'John123',
        lastName: 'Doe',
      };

      expect(() => securePersonalDataSchema.parse(data)).toThrow();
    });

    it('should reject invalid LinkedIn URLs', () => {
      const data = {
        linkedin: 'https://facebook.com/john',
      };

      expect(() => securePersonalDataSchema.parse(data)).toThrow();
    });
  });
});