import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppContext } from './AppState';

const API_BASE = '/api';

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [cases, setCases] = useState([]);
  const [timeOffsetDays, setTimeOffsetDays] = useState(0);
  const [systemDate, setSystemDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [defaultCompanyId, setDefaultCompanyId] = useState(null);
  const defaultCompanyIdRef = useRef(null);

  // Track API health across every page-level request. A wave of requests only
  // clears the indicator once it settles with no server error, so a success that
  // lands while another request is still in flight cannot hide the outage.
  useEffect(() => {
    const originalFetch = window.fetch;
    let pending = 0;
    let waveFailed = false;

    const isApiRequest = (input) => {
      const url = typeof input === 'string' ? input : input?.url ?? '';
      return url.startsWith(`${API_BASE}/`) || url.startsWith(`${API_BASE}?`);
    };

    const settle = (failed) => {
      pending -= 1;
      if (failed) {
        waveFailed = true;
        setReconnecting(true);
      }
      if (pending === 0) {
        // A wave clears the indicator only if it finished without any server error
        setReconnecting(waveFailed);
        waveFailed = false;
      }
    };

    const trackedFetch = async (input, init) => {
      if (!isApiRequest(input)) return originalFetch(input, init);

      if (pending === 0) waveFailed = false;
      pending += 1;

      try {
        const res = await originalFetch(input, init);
        settle(!res.ok && res.status >= 500);
        return res;
      } catch (err) {
        settle(true);
        throw err;
      }
    };

    window.fetch = trackedFetch;
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Initial load, retried until the backend answers so an outage doesn't strand the page
  useEffect(() => {
    let cancelled = false;
    const retryDelays = [1000, 2000, 4000, 8000];
    let retryTimer = null;

    const loadInitialData = async () => {
      const [usersOk, settingsOk] = await Promise.all([fetchUsers(), fetchDemoSettings()]);
      if (!usersOk || !settingsOk) return false;

      // Restore login session if saved
      const savedEmail = localStorage.getItem('sakhi_user_email');
      if (savedEmail) {
        const res = await login(savedEmail);
        // A stale saved account should not keep retrying against a backend that is answering
        if (!res.success) localStorage.removeItem('sakhi_user_email');
        return true;
      }

      // If no active session, load the demo company resolved from the backend
      const cid = await resolveCompanyId();
      if (!cid) return false;
      await fetchCases(cid);
      await fetchCompany(cid);
      return true;
    };

    const attempt = async (attemptIndex) => {
      const ok = await loadInitialData();
      if (cancelled) return;

      if (ok) {
        setLoading(false);
        return;
      }

      // Fast retries first; while the API stays down, render the app and keep polling
      if (attemptIndex >= retryDelays.length) setLoading(false);

      const waitMs = retryDelays[attemptIndex] ?? 15000;
      retryTimer = setTimeout(() => attempt(attemptIndex + 1), waitMs);
    };

    attempt(0);

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
    // Mount-only by design: the retry loop owns its polling, so re-running this
    // effect on a provider re-render would restart the initial load mid-outage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        return true;
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
    return false;
  };

  // Resolve the demo company from the backend instead of assuming an id.
  // Seeding inserts a fresh company row, so the id is not stable across resets.
  const resolveCompanyId = useCallback(async () => {
    if (defaultCompanyIdRef.current) return defaultCompanyIdRef.current;
    try {
      const res = await fetch(`${API_BASE}/companies`);
      if (res.ok) {
        const data = await res.json();
        const id = Array.isArray(data) && data.length > 0 ? data[0].id : null;
        defaultCompanyIdRef.current = id;
        setDefaultCompanyId(id);
        return id;
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
    return null;
  }, []);

  const fetchDemoSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/demo/settings`);
      if (res.ok) {
        const data = await res.json();
        setTimeOffsetDays(data.timeOffsetDays);
        setSystemDate(new Date(data.systemDate));
        return true;
      }
    } catch (err) {
      console.error('Error fetching demo settings:', err);
    }
    return false;
  };

  const fetchCompany = async (companyId) => {
    if (!companyId) return;
    try {
      const res = await fetch(`${API_BASE}/company/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentCompany(data);
      }
    } catch (err) {
      console.error('Error fetching company:', err);
    }
  };

  const fetchCases = async (companyId) => {
    if (!companyId) return;
    try {
      const res = await fetch(`${API_BASE}/cases?company_id=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error('Error fetching cases:', err);
    }
  };

  const login = async (email) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        localStorage.setItem('sakhi_user_email', email);
        if (user.company_id) {
          await fetchCompany(user.company_id);
          await fetchCases(user.company_id);
        } else {
          // District officer has no company of their own, load the demo company for reference
          const cid = await resolveCompanyId();
          await fetchCases(cid);
          await fetchCompany(cid);
        }
        return { success: true, user };
      }
      return { success: false, error: 'Failed to login' };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sakhi_user_email');
  };

  const timeTravel = async (days) => {
    try {
      const res = await fetch(`${API_BASE}/demo/travel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });
      if (res.ok) {
        const data = await res.json();
        setTimeOffsetDays(data.timeOffsetDays);
        setSystemDate(new Date(data.systemDate));
        
        // Refresh cases & company details to update computed columns / states
        if (currentUser && currentUser.company_id) {
          await fetchCases(currentUser.company_id);
          await fetchCompany(currentUser.company_id);
        } else {
          const cid = await resolveCompanyId();
          await fetchCases(cid);
          await fetchCompany(cid);
        }
      }
    } catch (err) {
      console.error('Time travel error:', err);
    }
  };

  const resetDemo = async () => {
    try {
      const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTimeOffsetDays(data.timeOffsetDays);
        setSystemDate(new Date(data.systemDate));
        await fetchUsers();
        // A reseed creates a new company row, so drop the cached company id
        defaultCompanyIdRef.current = null;
        setDefaultCompanyId(null);
        if (currentUser) {
          await login(currentUser.email);
        } else {
          const cid = await resolveCompanyId();
          await fetchCases(cid);
          await fetchCompany(cid);
        }
      }
    } catch (err) {
      console.error('Demo reset error:', err);
    }
  };

  const reloadAll = async () => {
    const cid = currentUser?.company_id ?? defaultCompanyIdRef.current ?? (await resolveCompanyId());
    if (!cid) return;
    await fetchCompany(cid);
    await fetchCases(cid);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      currentCompany,
      cases,
      timeOffsetDays,
      systemDate,
      loading,
      reconnecting,
      defaultCompanyId,
      resolveCompanyId,
      login,
      logout,
      timeTravel,
      resetDemo,
      reloadAll,
      fetchCompany,
      fetchCases,
      API_BASE
    }}>
      {children}
    </AppContext.Provider>
  );
};
