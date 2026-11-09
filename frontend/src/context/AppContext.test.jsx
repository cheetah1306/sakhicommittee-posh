import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { AppProvider } from './AppContext';
import { useApp } from './AppState';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const json = (body) => new Response(JSON.stringify(body), { status: 200 });

// The provider boots by loading users, demo settings, the company and its cases
const idleRoutes = {
  '/api/users': [],
  '/api/demo/settings': { timeOffsetDays: 0, systemDate: new Date().toISOString() },
  '/api/companies': [{ id: 9 }],
  '/api/company/9': { id: 9, name: 'Test Employer' },
  '/api/cases?company_id=9': []
};

let gates;

const stubFetch = async (input) => {
  const url = typeof input === 'string' ? input : input.url;
  if (gates.has(url)) return gates.get(url).promise;
  if (url in idleRoutes) return json(idleRoutes[url]);
  return json({});
};

let app = { reconnecting: false, loading: true };

const Probe = () => {
  const ctx = useApp();
  app = { reconnecting: ctx.reconnecting, loading: ctx.loading };
  return null;
};

describe('reconnecting indicator', () => {
  let container;
  let root;

  beforeEach(async () => {
    localStorage.clear();
    gates = new Map();
    window.fetch = stubFetch;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root.render(
        <AppProvider>
          <Probe />
        </AppProvider>
      );
    });
    expect(app.loading).toBe(false);
    expect(app.reconnecting).toBe(false);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('stays on until the wave settles clean, even when the success lands last', async () => {
    const failing = deferred();
    const succeeding = deferred();
    gates.set('/api/wave/fail', failing);
    gates.set('/api/wave/ok', succeeding);

    let failRequest;
    let okRequest;
    await act(async () => {
      failRequest = window.fetch('/api/wave/fail');
      okRequest = window.fetch('/api/wave/ok');
    });

    await act(async () => {
      failing.resolve(new Response('', { status: 502 }));
      await failRequest;
    });
    expect(app.reconnecting).toBe(true);

    // A success settling later in the same wave must not hide the recorded failure
    await act(async () => {
      succeeding.resolve(json({}));
      await okRequest;
    });
    expect(app.reconnecting).toBe(true);

    // Only a wave that finishes without any server error clears it
    await act(async () => {
      await window.fetch('/api/wave/clean');
    });
    expect(app.reconnecting).toBe(false);
  });
});
