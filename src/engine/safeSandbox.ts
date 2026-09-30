/**
 * FlowForge Secure Execution Sandbox
 * Provides isolated JavaScript execution with execution timeout and context protection.
 */

export interface SandboxContext {
  input: any;
  config: Record<string, any>;
  variables: Record<string, string>;
  utils: {
    formatDate: (date: string | number | Date, format?: string) => string;
    b64Encode: (str: string) => string;
    b64Decode: (str: string) => string;
    hashString: (str: string) => string;
    deepClone: <T>(obj: T) => T;
  };
}

export class SandboxTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Execution timed out after ${timeoutMs}ms. Possible infinite loop or excessive computation.`);
    this.name = 'SandboxTimeoutError';
  }
}

export class SandboxSecurityError extends Error {
  constructor(reason: string) {
    super(`Security policy violation: ${reason}`);
    this.name = 'SandboxSecurityError';
  }
}

/**
 * Executes user JavaScript expression or handler with strict scope isolation and timeout
 */
export async function executeInSafeSandbox(
  code: string,
  context: SandboxContext,
  timeoutMs: number = 2000
): Promise<any> {
  // Static analysis checks for prohibited globals and patterns
  const forbiddenPatterns = [
    /\bwindow\b/,
    /\bdocument\b/,
    /\bprocess\b/,
    /\brequire\b/,
    /\bimport\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bindexedDB\b/,
    /\beval\b/,
    /\bFunction\b/,
    /\bglobalThis\b/,
    /\b__proto__\b/,
    /\bconstructor\b\s*\.\s*constructor/
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(code)) {
      throw new SandboxSecurityError(`Code contains prohibited token matching: ${pattern.toString()}`);
    }
  }

  // Create isolated scope with masked globals
  const safeScope = {
    input: context.input,
    config: context.config,
    variables: context.variables,
    utils: context.utils,
    // Safe standard built-ins
    JSON,
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURI,
    decodeURI,
    encodeURIComponent,
    decodeURIComponent,
    // Explicitly shadow dangerous globals (excluding reserved strict-mode keywords)
    window: undefined,
    document: undefined,
    process: undefined,
    global: undefined,
    globalThis: undefined,
    fetch: undefined,
    XMLHttpRequest: undefined,
    localStorage: undefined,
    sessionStorage: undefined,
    indexedDB: undefined,
  };

  const paramNames = Object.keys(safeScope);
  const paramValues = Object.values(safeScope);

  // Wrap code into an async execution function
  let normalizedCode = code.trim();

  // Instrument loops to guard against synchronous infinite loops
  const deadlineCheck = `if (Date.now() > __deadline) { throw new Error('Execution timed out: loop exceeded deadline'); }`;
  
  // Instrument while(...) { and for(...) { and do {
  normalizedCode = normalizedCode.replace(
    /\b(while\s*\([^{)]*\)\s*\{)/g,
    `$1 ${deadlineCheck} `
  );
  normalizedCode = normalizedCode.replace(
    /\b(for\s*\([^{)]*\)\s*\{)/g,
    `$1 ${deadlineCheck} `
  );
  normalizedCode = normalizedCode.replace(
    /\b(do\s*\{)/g,
    `$1 ${deadlineCheck} `
  );

  const isExpression = !normalizedCode.includes('return') && !normalizedCode.includes(';') && !normalizedCode.startsWith('{');
  
  const functionBody = isExpression
    ? `"use strict"; return (${normalizedCode});`
    : `"use strict";
       const __deadline = Date.now() + ${timeoutMs};
       const runner = async () => {
         ${normalizedCode}
       };
       return runner();`;

  return new Promise((resolve, reject) => {
    let completed = false;

    const timer = setTimeout(() => {
      if (!completed) {
        completed = true;
        reject(new SandboxTimeoutError(timeoutMs));
      }
    }, timeoutMs);

    try {
      // Create isolated closure
      // Note: new Function is bounded here by our strict parameter list which shadows all standard dangerous globals
      const sandboxFn = new (Function.prototype.constructor as any)(...paramNames, functionBody);
      
      const resultPromise = sandboxFn(...paramValues);

      Promise.resolve(resultPromise)
        .then((res) => {
          if (!completed) {
            completed = true;
            clearTimeout(timer);
            resolve(res);
          }
        })
        .catch((err) => {
          if (!completed) {
            completed = true;
            clearTimeout(timer);
            reject(err);
          }
        });
    } catch (err) {
      if (!completed) {
        completed = true;
        clearTimeout(timer);
        reject(err);
      }
    }
  });
}

/**
 * Creates default sandbox utility suite
 */
export function createDefaultSandboxUtils() {
  return {
    formatDate: (date: string | number | Date, format?: string) => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid Date';
      if (format === 'iso') return d.toISOString();
      if (format === 'date') return d.toLocaleDateString();
      if (format === 'time') return d.toLocaleTimeString();
      return d.toLocaleString();
    },
    b64Encode: (str: string) => {
      try {
        return typeof btoa !== 'undefined' ? btoa(str) : Buffer.from(str).toString('base64');
      } catch {
        return '';
      }
    },
    b64Decode: (str: string) => {
      try {
        return typeof atob !== 'undefined' ? atob(str) : Buffer.from(str, 'base64').toString('utf-8');
      } catch {
        return '';
      }
    },
    hashString: (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
      }
      return 'h_' + Math.abs(hash).toString(16);
    },
    deepClone: <T>(obj: T): T => {
      return JSON.parse(JSON.stringify(obj));
    }
  };
}
