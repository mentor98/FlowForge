# FlowForge — Visual Workflow Automation Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)
[![Engine Status](https://img.shields.io/badge/Engine-Ready-10b981.svg)]()
[![Automated Tests](https://img.shields.io/badge/Tests-8%20Passing-emerald.svg)]()

> **Problem Statement:** People repeatedly perform the same digital tasks manually — copying payloads between systems, parsing incoming webhooks, validating data criteria, and handling API retries.  
> **Solution:** **FlowForge** is an open-source, visual workflow automation engine that enables engineers and teams to connect triggers, conditions, transformations, and integrations on an intuitive, interactive canvas with guaranteed execution boundaries, sliding-window rate limiting, and an extensible custom node plugin architecture.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Core Engine & Execution Model](#2-core-engine--execution-model)
3. [Visual Canvas & Node Ecosystem](#3-visual-canvas--node-ecosystem)
4. [Plugin Development Guide](#4-plugin-development-guide)
5. [Security Sandbox & Execution Boundaries](#5-security-sandbox--execution-boundaries)
6. [Rate Limiting Specification](#6-rate-limiting-specification)
7. [REST API & Webhooks Reference](#7-rest-api--webhooks-reference)
8. [Setup & Local Development](#8-setup--local-development)
9. [Deployment](#9-deployment)
10. [Automated Testing Suite](#10-automated-testing-suite)
11. [Contributing](#11-contributing)
12. [License](#12-license)

---

## 1. Architecture Overview

FlowForge is architected with a decoupled execution engine, an interactive visual canvas, and a unified Express/Node.js full-stack backend:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FlowForge Visual Studio                         │
│  ┌──────────────────────┐  ┌───────────────────┐  ┌─────────────────┐  │
│  │     Node Palette     │  │  Reactive Canvas  │  │ Node Inspector  │  │
│  │ (Triggers, Actions)  │  │  (SVG Bezier Wires)│  │ (Dynamic Forms) │  │
│  └──────────────────────┘  └───────────────────┘  └─────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ JSON Workflow Spec
┌────────────────────────────────────▼───────────────────────────────────┐
│                     FlowForge Execution Engine                         │
│  ┌──────────────────────┐  ┌───────────────────┐  ┌─────────────────┐  │
│  │  DAG Topological    │  │   Sliding-Window  │  │  Secure Sandbox │  │
│  │   Sort & Resolver    │  │    Rate Limiter   │  │ (Timeout Boundary│ │
│  └──────────────────────┘  └───────────────────┘  └─────────────────┘  │
│  ┌──────────────────────┐  ┌───────────────────┐  ┌─────────────────┐  │
│  │ Retry Backoff Logic  │  │ Branching Router  │  │  Plugin Manager │  │
│  │ (Fixed/Exponential)  │  │  (True / False)   │  │ (Custom Nodes)  │  │
│  └──────────────────────┘  └───────────────────┘  └─────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ REST / Webhooks
┌────────────────────────────────────▼───────────────────────────────────┐
│                    Express Full-Stack Server                           │
│  - /api/webhooks/:id   (Real external HTTP webhook ingestion)          │
│  - /api/workflows      (Workflow CRUD & compilation)                   │
│  - /api/executions     (Step waterfall audit trails)                   │
│  - /api/tests/run      (Automated test engine runner)                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Engine & Execution Model

The FlowForge engine coordinates DAG traversal, variable interpolation, conditional routing, and retries.

### Execution Lifecycle

1. **Rate Limit Check:** Evaluates both 1-minute throughput quota (`maxPerMinute`) and a 5-second sliding burst limit (`burstLimit`). If exceeded, execution aborts with cooldown metrics.
2. **Root Trigger Identification:** Discovers nodes with category `trigger` or nodes with in-degree 0.
3. **Topological Asynchronous Traversal:** Dispatches execution items in topological order. Downstream dependencies receive upstream payload outputs.
4. **Branch Sockets Filtering:** Nodes with branching (e.g. `If/Else`) activate distinct output sockets (`true` or `false`). Only outgoing edges wired to the activated socket are scheduled.
5. **Retry Policy Enforcement:** On step failure, the step executes up to `maxRetries` with fixed or exponential backoff:
   $$\text{Delay} = \text{backoffMs} \times 2^{(\text{attempt} - 1)}$$
6. **Error Handling Boundaries:**
   - `fail_workflow`: Immediately terminates the pipeline and records error diagnostics.
   - `continue_on_error`: Passes `{ error, failedNodeId }` downstream, continuing remaining steps.
   - `fallback_node`: Reroutes execution to a designated contingency node.

---

## 3. Visual Canvas & Node Ecosystem

FlowForge provides a high-density, dark-slate visual editor:
- **Infinite Drag-and-Pan:** Smooth trackpad, wheel, and keyboard navigation.
- **Dynamic Cubic Bezier Cables:** Mathematical SVG wires connecting output pins to input sockets.
- **Glowing Execution Pulses:** Live visual packets indicating active data flow along cables during execution.
- **Multi-Socket Branching:** Distinct colored sockets for `output` (cyan), `true` (emerald), and `false` (rose).

### Built-in Node Catalog

| Category | Node Type | Purpose | Key Parameters |
| :--- | :--- | :--- | :--- |
| **Trigger** | `trigger_manual` | Manual execution from canvas | `initialPayload` (JSON) |
| **Trigger** | `trigger_webhook` | Incoming HTTP webhook listener | `webhookPath`, `httpMethod`, `authSecret` |
| **Trigger** | `trigger_schedule` | Cron schedule trigger | `cronExpression` (5-part cron), `timezone` |
| **Condition**| `condition_branch`| Multi-rule boolean router | `rules` (field, operator, value), `logicalOperator` |
| **Condition**| `condition_filter`| Array item filtering | `arrayPath`, `filterProperty`, `filterOperator` |
| **Transform**| `transform_json` | JSON mapping template | `mappingTemplate` with `{{input.val}}` interpolation |
| **Transform**| `transform_js_sandbox` | Sandboxed JavaScript runner | `code` script with 2000ms execution timeout |
| **Transform**| `transform_path_extract` | Dot-notation property extractor | `path` (e.g. `items[0].id`), `fallbackValue` |
| **Action** | `action_http` | REST HTTP client call | `method`, `url`, `headers`, `body`, `timeoutMs` |
| **Action** | `action_webhook_send` | Slack/Discord alert dispatcher | `destination`, `messageTitle`, `messageContent` |
| **Action** | `action_delay` | Deliberate pipeline pause | `delayMs` |
| **Action** | `action_log` | Diagnostic audit log | `logLevel`, `messageTemplate` |

---

## 4. Plugin Development Guide

FlowForge features a dynamic plugin architecture enabling developers to build custom nodes with JSON form schemas and isolated JavaScript handlers.

### Creating a Custom Node

Open the **Plugin Studio** in the UI or define a `CustomPluginDefinition`:

```typescript
import { CustomPluginDefinition } from './types/workflow';

export const myCustomPlugin: CustomPluginDefinition = {
  id: 'plugin_tax_calculator',
  name: 'Tax & Currency Converter',
  version: '1.0.0',
  author: 'Finance Automations Team',
  description: 'Calculates regional sales tax and currency formatting.',
  category: 'transform',
  icon: 'Layers',
  inputs: [
    { id: 'input', name: 'Order Payload', type: 'input', dataType: 'json' }
  ],
  outputs: [
    { id: 'output', name: 'Adjusted Total', type: 'output', dataType: 'json' }
  ],
  configFields: [
    {
      name: 'vatRate',
      label: 'VAT Rate (%)',
      type: 'number',
      defaultValue: 20
    }
  ],
  handlerCode: `
    const subtotal = input.amount || 0;
    const rate = Number(config.vatRate) / 100;
    const tax = subtotal * rate;
    const total = subtotal + tax;

    return {
      subtotal,
      taxAmount: Number(tax.toFixed(2)),
      grandTotal: Number(total.toFixed(2)),
      currency: input.currency || 'USD',
      calculatedAt: utils.formatDate(Date.now(), 'iso')
    };
  `
};
```

### Handler Scope Invariants

Custom node code runs in a sandboxed execution context providing:
- `input`: The upstream incoming data object.
- `config`: Values entered by users in the Node Inspector form.
- `variables`: Safe dictionary of workflow environment variables.
- `utils`: Standard utilities:
  - `utils.formatDate(date, format)`
  - `utils.b64Encode(string)`
  - `utils.b64Decode(string)`
  - `utils.hashString(string)`
  - `utils.deepClone(object)`

---

## 5. Security Sandbox & Execution Boundaries

FlowForge provides isolation to prevent malicious or accidental host disruption:

1. **Global Scope Shadowing:** Variables such as `window`, `document`, `process`, `require`, `eval`, `localStorage`, `sessionStorage`, `indexedDB`, and constructor prototypes are shadowed with `undefined`.
2. **Static Token Analysis:** The sandbox pre-scans scripts for unauthorized access keywords (`/\bprocess\b/`, `/\brequire\b/`, `/\bwindow\b/`, `/\bdocument\b/`).
3. **Execution Timeout Boundary:** Handlers execute within an asynchronous deadline (default 2000ms). Infinite loops (`while (true) {}`) trigger a `SandboxTimeoutError` and are interrupted cleanly.
4. **Secret Masking:** Keys marked as secret in the Variables vault are masked visually (`••••••••`) and redacted from execution logs.

---

## 6. Rate Limiting Specification

FlowForge protects upstream targets and the local runtime via a sliding-window rate limiter (`WorkflowRateLimiter`):

- **Per-Minute Threshold:** Calculates request timestamps across a 60,000ms rolling window.
- **Burst Protection Window:** Tracks bursts across a tight 5,000ms sliding window.
- **Configurable Limits:** Set per-workflow in the rateLimit configuration:
  ```json
  {
    "enabled": true,
    "maxPerMinute": 60,
    "burstLimit": 15
  }
  ```
- **Rejection Diagnostics:** Rejected calls return HTTP 429 with exact `resetInSeconds` cooldown timers.

---

## 7. REST API & Webhooks Reference

The Express server exposes the following REST endpoints:

### Webhooks
- `POST /api/webhooks/:webhookId`  
  Ingests external HTTP webhooks. Passes headers, query params, and JSON body to the matching workflow, executes the pipeline, and returns execution metrics.
- `GET /api/webhooks/:webhookId`  
  Verification endpoint for third-party webhook verification handshakes.

### Workflows
- `GET /api/workflows` — Retrieve all saved workflows.
- `GET /api/workflows/:id` — Retrieve a specific workflow definition.
- `POST /api/workflows` — Create or update a workflow definition.
- `DELETE /api/workflows/:id` — Remove a workflow.
- `POST /api/workflows/:id/execute` — Trigger execution with custom `{ payload: { ... } }`.

### Executions & Diagnostics
- `GET /api/executions` — Query execution history and step waterfall logs.
- `POST /api/tests/run` — Run the 8-suite engine verification suite.
- `POST /api/rate-limit/reset` — Reset active sliding windows.

---

## 8. Setup & Local Development

### Prerequisites
- Node.js 18.0 or later
- npm 9.0 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/flowforge/flowforge.git
cd flowforge

# Install dependencies
npm install

# Start full-stack dev server (port 3000)
npm run dev
```

Visit `http://localhost:3000` to launch the FlowForge visual editor.

---

## 9. Deployment

### Production Build

```bash
# Build Vite production client assets
npm run build

# Start production server
npm start
```

### Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Listening port for Express server | `3000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `APP_URL` | Public URL for webhook callbacks | `http://localhost:3000` |

---

## 10. Automated Testing Suite

FlowForge includes an integrated test runner executing 8 verification suites:

1. **DAG Linear Propagation:** Confirms sequential output forwarding across nodes.
2. **Conditional Branching:** Verifies mutually exclusive activation of `true` vs `false` sockets.
3. **JSON Interpolation:** Tests `{{input.val}}` and `{{variables.KEY}}` token mapping.
4. **Sandbox Global Isolation:** Asserts interception of `window`, `document`, and `process`.
5. **Execution Timeout Boundary:** Asserts interruption of infinite `while(true)` loops within 300ms.
6. **Sliding-Window Rate Limiting:** Verifies burst quota rejection and reset timers.
7. **Retry Backoff Logic:** Asserts retry attempts on simulated transient 503 errors.
8. **Plugin Lifecycle:** Validates dynamic custom plugin registration and execution.

Run tests in the UI by clicking **Engine Tests** in the navigation bar or via `npm run lint`.

---

## 11. Contributing

We welcome community contributions, custom node plugins, and improvements!

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-node-plugin`.
3. Commit your changes: `git commit -m 'feat: Add XML Parser node plugin'`.
4. Ensure all automated tests pass: `npm run lint`.
5. Push to your branch and open a Pull Request.

---

## 12. License

FlowForge is open-source software licensed under the [MIT License](LICENSE).
Copyright (c) 2026 FlowForge Contributors.
