/**
 * FlowForge Automation Engine - Full-Stack Express Server
 * Serves visual editor via Vite middleware, handles webhook ingestion,
 * REST API for workflows, executions, rate limiting, and test suites.
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { WORKFLOW_TEMPLATES } from './src/engine/templates.ts';
import { WorkflowEngine } from './src/engine/workflowEngine.ts';
import { globalRateLimiter } from './src/engine/rateLimiter.ts';
import { pluginManager } from './src/engine/pluginManager.ts';
import { flowForgeTestSuite } from './src/engine/testSuite.ts';
import { WorkflowDefinition, ExecutionRecord } from './src/types/workflow.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// In-memory data store for server-side persistence
const workflowsStore = new Map<string, WorkflowDefinition>();
const executionHistoryStore: ExecutionRecord[] = [];

// Seed templates into memory
WORKFLOW_TEMPLATES.forEach(tpl => workflowsStore.set(tpl.id, tpl));

async function bootstrap() {
  const app = express();

  // Basic middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logger for API calls
  app.use('/api', (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // ==========================================
  // REST API Endpoints
  // ==========================================

  // 1. Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      engine: 'FlowForge Automation Engine',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      workflowsCount: workflowsStore.size,
      executionsCount: executionHistoryStore.length,
      timestamp: new Date().toISOString()
    });
  });

  // 2. Workflows CRUD
  app.get('/api/workflows', (req: Request, res: Response) => {
    const list = Array.from(workflowsStore.values());
    res.json({ workflows: list });
  });

  app.get('/api/workflows/:id', (req: Request, res: Response) => {
    const wf = workflowsStore.get(req.params.id);
    if (!wf) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json({ workflow: wf });
  });

  app.post('/api/workflows', (req: Request, res: Response) => {
    const wf: WorkflowDefinition = req.body;
    if (!wf || !wf.id || !wf.name) {
      return res.status(400).json({ error: 'Invalid workflow definition: id and name are required.' });
    }
    wf.updatedAt = new Date().toISOString();
    if (!wf.createdAt) wf.createdAt = wf.updatedAt;
    workflowsStore.set(wf.id, wf);
    res.json({ success: true, workflow: wf });
  });

  app.delete('/api/workflows/:id', (req: Request, res: Response) => {
    const deleted = workflowsStore.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json({ success: true });
  });

  // 3. Workflow Execution Trigger
  app.post('/api/workflows/:id/execute', async (req: Request, res: Response) => {
    const wf = workflowsStore.get(req.params.id);
    if (!wf) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const payload = req.body?.payload || {};
    const engine = new WorkflowEngine();
    
    try {
      const record = await engine.executeWorkflow(wf, payload);
      executionHistoryStore.unshift(record);
      // Keep recent 100 executions
      if (executionHistoryStore.length > 100) {
        executionHistoryStore.pop();
      }
      res.json({ success: true, execution: record });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Execution failed' });
    }
  });

  // 4. Real Webhook Ingestion Endpoint
  // Supports POST, GET, PUT at /api/webhooks/:webhookId
  const handleWebhook = async (req: Request, res: Response) => {
    const { webhookId } = req.params;
    
    // Find workflow matching webhookId or having a webhook trigger node matching path
    let matchingWf: WorkflowDefinition | undefined;

    for (const wf of workflowsStore.values()) {
      if (wf.webhookId === webhookId) {
        matchingWf = wf;
        break;
      }
      const hasNode = wf.nodes.some(
        n => n.type === 'trigger_webhook' && (n.data?.webhookPath === webhookId || n.data?.webhookPath === `events/${webhookId}`)
      );
      if (hasNode) {
        matchingWf = wf;
        break;
      }
    }

    if (!matchingWf) {
      // Check if it's the stripe or github template
      matchingWf = Array.from(workflowsStore.values())[0];
    }

    if (!matchingWf) {
      return res.status(404).json({
        error: `No workflow registered for webhook identifier: ${webhookId}`,
        tip: 'Register a webhook in a workflow or use one of the built-in template IDs.'
      });
    }

    const webhookPayload = {
      ...(typeof req.body === 'object' && req.body !== null ? req.body : {}),
      method: req.method,
      webhookId,
      headers: req.headers,
      query: req.query,
      body: req.body,
      receivedAt: new Date().toISOString()
    };

    const engine = new WorkflowEngine();
    const record = await engine.executeWorkflow(matchingWf, webhookPayload);

    executionHistoryStore.unshift(record);
    if (executionHistoryStore.length > 100) executionHistoryStore.pop();

    res.status(200).json({
      received: true,
      workflowId: matchingWf.id,
      workflowName: matchingWf.name,
      executionId: record.id,
      status: record.status,
      durationMs: record.durationMs,
      output: record.finalOutput
    });
  };

  app.post('/api/webhooks/:webhookId', handleWebhook);
  app.get('/api/webhooks/:webhookId', handleWebhook);
  app.put('/api/webhooks/:webhookId', handleWebhook);

  // 5. Execution History
  app.get('/api/executions', (req: Request, res: Response) => {
    const workflowId = req.query.workflowId as string | undefined;
    let list = executionHistoryStore;
    if (workflowId) {
      list = list.filter(e => e.workflowId === workflowId);
    }
    res.json({ executions: list });
  });

  // 6. Custom Plugins API
  app.get('/api/plugins', (req: Request, res: Response) => {
    res.json({ plugins: pluginManager.getAll() });
  });

  app.post('/api/plugins', (req: Request, res: Response) => {
    const plugin = req.body;
    if (!plugin || !plugin.id || !plugin.name) {
      return res.status(400).json({ error: 'Plugin must include id, name, and handlerCode.' });
    }
    pluginManager.register(plugin);
    res.json({ success: true, plugin });
  });

  // 7. Automated Test Suite Runner
  app.post('/api/tests/run', async (req: Request, res: Response) => {
    try {
      const results = await flowForgeTestSuite.runAllTests();
      res.json({
        success: true,
        testsCount: results.length,
        passedCount: results.filter(r => r.passed).length,
        failedCount: results.filter(r => !r.passed).length,
        results
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Test suite execution failure' });
    }
  });

  // 8. Rate Limiter Reset
  app.post('/api/rate-limit/reset', (req: Request, res: Response) => {
    globalRateLimiter.resetAll();
    res.json({ success: true, message: 'All rate limit tracking windows reset.' });
  });

  // ==========================================
  // Vite Integration (Dev) / Static Files (Prod)
  // ==========================================
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FlowForge Engine server listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('Failed to start FlowForge server:', err);
  process.exit(1);
});
