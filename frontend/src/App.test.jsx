import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import App from './App';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const json = (body) => new Response(JSON.stringify(body), { status: 200 });

// Routes the provider needs for its initial load
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

const pillShown = () => document.body.textContent.includes('Reconnecting to server');

describe('Reconnecting pill', () => {
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
      root.render(<App />);
    });
    // Let the initial load settle so the app shell (and the pill slot) is mounted
    await act(async () => {});
    await act(async () => {});
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('appears while the API is failing and disappears once a clean wave completes', async () => {
    expect(pillShown()).toBe(false);

    const failing = deferred();
    gates.set('/api/wave/fail', failing);

    let request;
    await act(async () => {
      request = window.fetch('/api/wave/fail');
    });
    await act(async () => {
      failing.resolve(new Response('', { status: 502 }));
      await request;
    });
    expect(pillShown()).toBe(true);

    await act(async () => {
      await window.fetch('/api/wave/clean');
    });
    expect(pillShown()).toBe(false);
  });
});
