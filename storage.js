// AppStorage wrapper: unify localStorage/sessionStorage with robust fallback
(function(){
  function safeGet(storage, key) {
    try { return storage.getItem(key); } catch (e) { return null; }
  }

  function safeSet(storage, key, value) {
    try { storage.setItem(key, value); return true; } catch (e) { return false; }
  }

  function safeRemove(storage, key) {
    try { storage.removeItem(key); } catch (e) {}
  }

  window.AppStorage = {
    get: function(key) {
      try {
        // Try localStorage first
        let v = safeGet(localStorage, key);
        
        // Fall back to sessionStorage
        if (v === null || v === undefined) {
          v = safeGet(sessionStorage, key);
        }
        
        // Parse and return
        if (v) {
          try {
            const parsed = JSON.parse(v);
            return parsed;
          } catch (parseErr) {
            console.error('AppStorage.get JSON parse error for key:', key, parseErr);
            return null;
          }
        }
        return null;
      } catch (e) {
        console.error('AppStorage.get error:', e);
        return null;
      }
    },

    set: function(key, value) {
      try {
        const str = JSON.stringify(value);
        // Write to both storages
        safeSet(localStorage, key, str);
        safeSet(sessionStorage, key, str);
      } catch (e) {
        console.error('AppStorage.set error:', e);
      }
    },

    remove: function(key) {
      try {
        safeRemove(localStorage, key);
        safeRemove(sessionStorage, key);
      } catch (e) {
        console.error('AppStorage.remove error:', e);
      }
    },

    raw: {
      local: localStorage,
      session: sessionStorage
    }
  };

  console.log('AppStorage initialized');
})();
