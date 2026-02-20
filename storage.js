// AppStorage wrapper (duplicate in folder for local pages)
(function(){
  const isFile = window.location.protocol === 'file:';
  const storages = [localStorage, sessionStorage];

  function safeGet(storage, key) {
    try { return storage.getItem(key); } catch (e) { return null; }
  }

  function safeSet(storage, key, value) {
    try { storage.setItem(key, value); return true; } catch (e) { return false; }
  }

  window.AppStorage = {
    get: function(key) {
      let v = safeGet(localStorage, key);
      if (v === null || v === undefined) v = safeGet(sessionStorage, key);
      try { return v ? JSON.parse(v) : null; } catch (e) { console.error('AppStorage.get parse error', e); return null; }
    },

    set: function(key, value) {
      const str = JSON.stringify(value);
      safesetAll(str, key);
    },

    remove: function(key) {
      try { localStorage.removeItem(key); } catch (e) {}
      try { sessionStorage.removeItem(key); } catch (e) {}
    },

    raw: {
      local: localStorage,
      session: sessionStorage
    }
  };

  function safesetAll(str, key) {
    try { safeSet(localStorage, key, str); } catch (e) {}
    try { safeSet(sessionStorage, key, str); } catch (e) {}
  }

  window.AppStorage._safesetAll = safesetAll;
})();
