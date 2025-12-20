(function(){
  const API = {
    login: '/api/auth/login',
    me: '/api/auth/me',
    protected: '/api/protected',
    songs: '/api/songs',
    songsImport: '/api/songs/import',
    categories: '/api/categories',
    playlists: '/api/playlists'
  };

  const storage = {
    get token(){ return localStorage.getItem('token'); },
    set token(v){ localStorage.setItem('token', v); },
    clear(){ localStorage.removeItem('token'); }
  };

  function go(path){ window.location.href = path; }

  function setMessage(el, text, isError){ if(!el) return; el.textContent = text || ''; el.style.color = isError ? '#ff6b6b' : '#9aa4c7'; }

  async function apiFetch(url, opts = {}){
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if(storage.token){ headers['Authorization'] = `Bearer ${storage.token}`; }
    const res = await fetch(url, { ...opts, headers });
    let data = null; try { data = await res.json(); } catch(_){}
    if(!res.ok){ const msg = (data && (data.error || data.message)) || res.statusText; throw new Error(msg); }
    return data;
  }

  // Categories Management
  const categoriesTable = document.getElementById('categoriesTable');
  const categoriesMsg = document.getElementById('categoriesMsg');
  const categoryForm = document.getElementById('categoryForm');

  async function loadCategories(){
    if(!categoriesTable) return;
    try {
      const data = await apiFetch(API.categories);
      categoriesCache = data.items || [];
      populateCategorySelect(editFields.category ? editFields.category.value : '');
      const tbody = categoriesTable.querySelector('tbody');
      tbody.innerHTML = '';
      if(categoriesCache.length === 0){
        const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="3">Belum ada kategori</td>'; tbody.appendChild(tr);
      } else {
        for(const c of categoriesCache){
          const tr = document.createElement('tr');
          const name = document.createElement('td'); name.textContent = c.name;
          const created = document.createElement('td'); created.textContent = c.createdAt ? new Date(c.createdAt).toLocaleString() : '-';
          const actions = document.createElement('td');
          const edit = document.createElement('button'); edit.textContent = 'Edit'; edit.style.marginRight = '8px';
          edit.addEventListener('click', ()=> openCategoryModal(c));
          const del = document.createElement('button'); del.textContent = 'Hapus'; del.className = 'outline';
          del.addEventListener('click', async ()=>{
            if(!confirm('Hapus kategori ini?')) return;
            try { await apiFetch(`${API.categories}/${c.id}`, { method: 'DELETE' }); await loadCategories(); }
            catch(err){ setMessage(categoriesMsg, 'Gagal hapus: ' + err.message, true); }
          });
          actions.appendChild(edit);
          actions.appendChild(del);
          tr.appendChild(name); tr.appendChild(created); tr.appendChild(actions);
          tbody.appendChild(tr);
        }
      }
      setMessage(categoriesMsg, '');
    } catch(err){ setMessage(categoriesMsg, 'Gagal memuat: ' + err.message, true); }
  }

  if(categoryForm){
    categoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(categoryForm);
      const name = (form.get('name') || '').trim();
      if(!name){ setMessage(categoriesMsg, 'Nama kategori wajib.', true); return; }
      setMessage(categoriesMsg, 'Menyimpan...');
      try{ await apiFetch(API.categories, { method: 'POST', body: JSON.stringify({ name }) });
        categoryForm.reset(); await loadCategories(); setMessage(categoriesMsg, 'Tersimpan');
      } catch(err){ setMessage(categoriesMsg, 'Gagal simpan: ' + err.message, true); }
    });
  }

  // Playlists Management
  const playlistsTable = document.getElementById('playlistsTable');
  const playlistsMsg = document.getElementById('playlistsMsg');
  const playlistForm = document.getElementById('playlistForm');

  async function loadPlaylists(){
    if(!playlistsTable) return;
    try{
      const data = await apiFetch(API.playlists);
      const items = data.items || [];
      const tbody = playlistsTable.querySelector('tbody');
      tbody.innerHTML = '';
      if(items.length===0){ const tr=document.createElement('tr'); tr.innerHTML='<td colspan="5">Belum ada playlist</td>'; tbody.appendChild(tr); }
      else {
        for(const p of items){
          const tr = document.createElement('tr');
          const name = document.createElement('td'); name.textContent = p.name;
          const desc = document.createElement('td'); desc.textContent = p.description || '';
          const count = document.createElement('td'); count.textContent = Array.isArray(p.items) ? p.items.length : 0;
          const created = document.createElement('td'); created.textContent = p.createdAt ? new Date(p.createdAt).toLocaleString() : '-';
          const actions = document.createElement('td');
          const itemsBtn = document.createElement('button'); itemsBtn.type = 'button'; itemsBtn.textContent = 'Lihat Items'; itemsBtn.style.marginRight = '8px';
          itemsBtn.addEventListener('click', ()=> openPlaylistItemsModal(p));
          const add = document.createElement('button'); add.type = 'button'; add.textContent = 'Tambah Song'; add.style.marginRight = '8px';
          add.addEventListener('click', ()=> openAddToPlaylistModal(p));
          const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Edit'; edit.style.marginRight = '8px';
          edit.addEventListener('click', ()=> openPlaylistModal(p));
          const del = document.createElement('button'); del.type = 'button'; del.textContent = 'Hapus'; del.className = 'outline';
          del.addEventListener('click', async ()=>{
            if(!confirm('Hapus playlist ini?')) return;
            try{ await apiFetch(`${API.playlists}/${p.id}`, { method: 'DELETE' }); await loadPlaylists(); }
            catch(err){ setMessage(playlistsMsg, 'Gagal hapus: ' + err.message, true); }
          });
          actions.appendChild(itemsBtn);
          actions.appendChild(add);
          actions.appendChild(edit);
          actions.appendChild(del);
          tr.appendChild(name); tr.appendChild(desc); tr.appendChild(count); tr.appendChild(created); tr.appendChild(actions);
          tbody.appendChild(tr);
        }
      }
      setMessage(playlistsMsg, '');
    }catch(err){ setMessage(playlistsMsg, 'Gagal memuat: ' + err.message, true); }
  }

  if(playlistForm){
    playlistForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(playlistForm);
      const name = (form.get('name') || '').trim();
      const description = (form.get('description') || '').trim();
      if(!name){ setMessage(playlistsMsg, 'Nama playlist wajib.', true); return; }
      setMessage(playlistsMsg, 'Menyimpan...');
      try{ await apiFetch(API.playlists, { method: 'POST', body: JSON.stringify({ name, description }) });
        playlistForm.reset(); await loadPlaylists(); setMessage(playlistsMsg, 'Tersimpan');
      }catch(err){ setMessage(playlistsMsg, 'Gagal simpan: ' + err.message, true); }
    });
  }

  // Tabs logic
  const topbar = document.querySelector('.topbar nav');
  const tabLinks = topbar ? Array.from(topbar.querySelectorAll('a[href^="#"]')) : [];
  const panes = Array.from(document.querySelectorAll('.tab-pane'));

  function setActiveTab(id){
    const target = id && id.startsWith('#') ? id.slice(1) : id;
    panes.forEach(p => p.classList.toggle('active', p.id === target));
    tabLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${target}`));
    // lazy load data for certain tabs
    if(target === 'categories') loadCategories();
    if(target === 'playlists') loadPlaylists();
    if(target === 'songs' || target === 'add') loadCategories();
  }

  function handleTabClick(e){
    if(!e.target.closest('a')) return;
    const a = e.target.closest('a');
    const href = a.getAttribute('href');
    if(!href || !href.startsWith('#')) return;
    e.preventDefault();
    history.replaceState(null, '', href);
    setActiveTab(href);
  }

  if(topbar){ topbar.addEventListener('click', handleTabClick); }
  // Init from hash or default to #overview
  setActiveTab(location.hash || '#overview');

  // Category Edit Modal Logic
  const catModal = document.getElementById('editCategoryModal');
  const catForm = document.getElementById('editCategoryForm');
  const catMsg = document.getElementById('catMsg');
  const catCloseBtn = document.getElementById('catCloseBtn');
  const catCancelBtn = document.getElementById('catCancelBtn');
  const catFields = { id: document.getElementById('cat_id'), name: document.getElementById('cat_name') };

  function openCategoryModal(cat){
    if(!catModal) return;
    catFields.id.value = cat.id;
    catFields.name.value = cat.name || '';
    setMessage(catMsg, '');
    catModal.classList.remove('hidden'); catModal.setAttribute('aria-hidden','false');
  }
  function closeCategoryModal(){ if(!catModal) return; catModal.classList.add('hidden'); catModal.setAttribute('aria-hidden','true'); }
  if(catCloseBtn) catCloseBtn.addEventListener('click', closeCategoryModal);
  if(catCancelBtn) catCancelBtn.addEventListener('click', closeCategoryModal);
  if(catModal){ catModal.addEventListener('click', (e)=>{ if(e.target.classList.contains('modal-backdrop')) closeCategoryModal(); }); }
  if(catForm){
    catForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      try{
        const id = catFields.id.value; const name = (catFields.name.value||'').trim();
        if(!name) throw new Error('Nama wajib');
        await apiFetch(`${API.categories}/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
        closeCategoryModal(); await loadCategories();
      }catch(err){ setMessage(catMsg, 'Gagal simpan: ' + err.message, true); }
    });
  }

  // Playlist Edit Modal Logic
  const plModal = document.getElementById('editPlaylistModal');
  const plForm = document.getElementById('editPlaylistForm');
  const plMsg = document.getElementById('plMsg');
  const plCloseBtn = document.getElementById('plCloseBtn');
  const plCancelBtn = document.getElementById('plCancelBtn');
  const plFields = { id: document.getElementById('pl_id'), name: document.getElementById('pl_name'), description: document.getElementById('pl_description') };

  function openPlaylistModal(pl){ if(!plModal) return; plFields.id.value=pl.id; plFields.name.value=pl.name||''; plFields.description.value=pl.description||''; setMessage(plMsg,''); plModal.classList.remove('hidden'); plModal.setAttribute('aria-hidden','false'); }
  function closePlaylistModal(){ if(!plModal) return; plModal.classList.add('hidden'); plModal.setAttribute('aria-hidden','true'); }
  if(plCloseBtn) plCloseBtn.addEventListener('click', closePlaylistModal);
  if(plCancelBtn) plCancelBtn.addEventListener('click', closePlaylistModal);
  if(plModal){ plModal.addEventListener('click', (e)=>{ if(e.target.classList.contains('modal-backdrop')) closePlaylistModal(); }); }
  if(plForm){ plForm.addEventListener('submit', async (e)=>{ e.preventDefault(); try{ const id=plFields.id.value; const name=(plFields.name.value||'').trim(); const description=(plFields.description.value||'').trim(); if(!name) throw new Error('Nama wajib'); await apiFetch(`${API.playlists}/${id}`, { method:'PATCH', body: JSON.stringify({ name, description }) }); closePlaylistModal(); await loadPlaylists(); }catch(err){ setMessage(plMsg, 'Gagal simpan: ' + err.message, true); } }); }

  // Add Song to Playlist Modal Logic
  const addToPlModal = document.getElementById('addToPlaylistModal');
  const addToPlForm = document.getElementById('addToPlaylistForm');
  const addToPlMsg = document.getElementById('addToPlMsg');
  const addToPlCloseBtn = document.getElementById('addToPlCloseBtn');
  const addToPlCancelBtn = document.getElementById('addToPlCancelBtn');
  const addToPlFields = { playlistId: document.getElementById('add_playlist_id'), songSelect: document.getElementById('add_song_select') };

  async function populateSongsSelect(){
    if(!addToPlFields.songSelect) return;
    const playlistId = addToPlFields.playlistId && addToPlFields.playlistId.value;
    // Load all songs and current playlist detail to filter out existing items
    const [songsData, plDetail] = await Promise.all([
      apiFetch(API.songs),
      playlistId ? apiFetch(`${API.playlists}/${playlistId}`) : Promise.resolve({ items: [] })
    ]);
    const allSongs = (songsData.items || []);
    const existingIds = new Set((plDetail && plDetail.items) || []);
    const available = allSongs.filter(s => !existingIds.has(s.id));
    // Populate select
    if(available.length === 0){
      addToPlFields.songSelect.innerHTML = '<option value="">(Tidak ada lagu yang tersedia)</option>';
      const submitBtn = addToPlForm ? addToPlForm.querySelector('button[type="submit"]') : null;
      if(submitBtn) submitBtn.disabled = true;
    } else {
      addToPlFields.songSelect.innerHTML = available.map(s => `<option value="${s.id}">${(s.title||'Untitled')}</option>`).join('');
      const submitBtn = addToPlForm ? addToPlForm.querySelector('button[type="submit"]') : null;
      if(submitBtn) submitBtn.disabled = false;
    }
  }

  function openAddToPlaylistModal(pl){ if(!addToPlModal) return; addToPlFields.playlistId.value = pl.id; setMessage(addToPlMsg,''); addToPlModal.classList.remove('hidden'); addToPlModal.setAttribute('aria-hidden','false'); populateSongsSelect(); }
  function closeAddToPlaylistModal(){ if(!addToPlModal) return; addToPlModal.classList.add('hidden'); addToPlModal.setAttribute('aria-hidden','true'); }
  if(addToPlCloseBtn) addToPlCloseBtn.addEventListener('click', closeAddToPlaylistModal);
  if(addToPlCancelBtn) addToPlCancelBtn.addEventListener('click', closeAddToPlaylistModal);
  if(addToPlModal){ addToPlModal.addEventListener('click', (e)=>{ if(e.target.classList.contains('modal-backdrop')) closeAddToPlaylistModal(); }); }
  if(addToPlForm){ addToPlForm.addEventListener('submit', async (e)=>{ e.preventDefault(); try{ const playlistId = addToPlFields.playlistId.value; const songId = addToPlFields.songSelect.value; if(!songId) throw new Error('Pilih lagu'); await apiFetch(`${API.playlists}/${playlistId}/items`, { method: 'POST', body: JSON.stringify({ songId }) }); closeAddToPlaylistModal(); await loadPlaylists(); } catch(err){ setMessage(addToPlMsg, 'Gagal tambah: ' + err.message, true); } }); }

  // Playlist Items Modal Logic
  const plItemsModal = document.getElementById('playlistItemsModal');
  const plItemsCloseBtn = document.getElementById('plItemsCloseBtn');
  const plItemsMsg = document.getElementById('plItemsMsg');
  const plItemsTable = document.getElementById('plItemsTable');
  const plItemsPlaylistId = document.getElementById('plItems_playlist_id');

  function closePlaylistItemsModal(){ if(!plItemsModal) return; plItemsModal.classList.add('hidden'); plItemsModal.setAttribute('aria-hidden','true'); }
  if(plItemsCloseBtn) plItemsCloseBtn.addEventListener('click', closePlaylistItemsModal);
  if(plItemsModal){ plItemsModal.addEventListener('click', (e)=>{ if(e.target.classList.contains('modal-backdrop')) closePlaylistItemsModal(); }); }

  async function openPlaylistItemsModal(pl){
    if(!plItemsModal) return;
    plItemsPlaylistId.value = pl.id;
    setMessage(plItemsMsg, 'Memuat items...');
    plItemsModal.classList.remove('hidden'); plItemsModal.setAttribute('aria-hidden','false');
    try{
      // get playlist detail and songs list to map titles
      const [plDetail, songsData] = await Promise.all([
        apiFetch(`${API.playlists}/${pl.id}`),
        apiFetch(API.songs)
      ]);
      const items = (plDetail.items || []);
      const songs = (songsData.items || []);
      const tbody = plItemsTable.querySelector('tbody');
      tbody.innerHTML = '';
      if(items.length === 0){
        const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="3">Belum ada lagu</td>'; tbody.appendChild(tr);
      } else {
        for(const songId of items){
          const s = songs.find(x => x.id === songId) || {};
          const tr = document.createElement('tr');
          const title = document.createElement('td'); title.textContent = s.title || '(unknown)';
          const cat = document.createElement('td');
          const catName = (categoriesCache.find(c => c.id === s.categoryId) || {}).name || '';
          cat.textContent = catName || '-';
          const actions = document.createElement('td');
          const removeBtn = document.createElement('button'); removeBtn.type = 'button'; removeBtn.textContent = 'Hapus'; removeBtn.className = 'outline';
          removeBtn.addEventListener('click', async () => {
            try{
              await apiFetch(`${API.playlists}/${pl.id}/items/${songId}`, { method: 'DELETE' });
              await openPlaylistItemsModal(pl); // reload list
              await loadPlaylists();
            }catch(err){ setMessage(plItemsMsg, 'Gagal hapus: ' + err.message, true); }
          });
          actions.appendChild(removeBtn);
          tr.appendChild(title); tr.appendChild(cat); tr.appendChild(actions);
          tbody.appendChild(tr);
        }
      }
      setMessage(plItemsMsg, '');
    }catch(err){ setMessage(plItemsMsg, 'Gagal memuat: ' + err.message, true); }
  }

  // Edit Modal Logic
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editForm');
  const editMsg = document.getElementById('editMsg');
  const editCloseBtn = document.getElementById('editCloseBtn');
  const editCancelBtn = document.getElementById('editCancelBtn');
  const editFields = {
    id: document.getElementById('edit_id'),
    title: document.getElementById('edit_title'),
    url: document.getElementById('edit_url'),
    duration: document.getElementById('edit_duration'),
    thumbnail: document.getElementById('edit_thumbnail'),
    source: document.getElementById('edit_source'),
    category: document.getElementById('edit_category'),
  };

  let categoriesCache = [];

  function populateCategorySelect(selectedId){
    if(!editFields.category) return;
    const sel = editFields.category;
    const current = sel.value;
    // Keep the first option (empty)
    sel.innerHTML = '<option value="">(Tidak ada)</option>' +
      categoriesCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    sel.value = (selectedId || '');
  }

  function openEditModal(song){
    if(!editModal) return;
    editFields.id.value = song.id || '';
    editFields.title.value = song.title || '';
    editFields.url.value = song.url || '';
    editFields.duration.value = song.durationSeconds != null ? String(song.durationSeconds) : '';
    editFields.thumbnail.value = song.thumbnail || '';
    editFields.source.value = song.source || '';
    // Ensure categories are loaded so selected value can be applied
    if(!Array.isArray(categoriesCache) || categoriesCache.length === 0){
      // populate quickly with empty list, then refresh once categories loaded
      populateCategorySelect(song.categoryId || '');
      loadCategories().then(() => {
        populateCategorySelect(song.categoryId || '');
      }).catch(() => {
        /* ignore */
      });
    } else {
      populateCategorySelect(song.categoryId || '');
    }
    setMessage(editMsg, '');
    editModal.classList.remove('hidden');
    editModal.setAttribute('aria-hidden', 'false');
  }

  function closeEditModal(){
    if(!editModal) return;
    editModal.classList.add('hidden');
    editModal.setAttribute('aria-hidden', 'true');
  }

  if(editCloseBtn){ editCloseBtn.addEventListener('click', closeEditModal); }
  if(editCancelBtn){ editCancelBtn.addEventListener('click', closeEditModal); }
  if(editModal){
    editModal.addEventListener('click', (e) => {
      if(e.target && e.target.classList && e.target.classList.contains('modal-backdrop')){
        closeEditModal();
      }
    });
  }

  if(editForm){
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try{
        const id = editFields.id.value;
        const payload = {
          title: (editFields.title.value || '').trim(),
          url: (editFields.url.value || '').trim(),
          source: (editFields.source.value || '').trim() || undefined,
          thumbnail: (editFields.thumbnail.value || '').trim() || undefined,
        };
        const cat = (editFields.category.value || '').trim();
        if(cat.length > 0) payload.categoryId = cat; else payload.categoryId = null;
        const dur = (editFields.duration.value || '').trim();
        if(dur.length > 0){
          const n = Number(dur);
          if(!Number.isFinite(n) || n < 0) throw new Error('Durasi tidak valid');
          payload.durationSeconds = n;
        } else {
          payload.durationSeconds = null;
        }
        if(!payload.title || !payload.url) throw new Error('Judul dan URL wajib diisi');
        await apiFetch(`${API.songs}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        setMessage(editMsg, 'Tersimpan');
        closeEditModal();
        await loadSongs();
      }catch(err){ setMessage(editMsg, 'Gagal simpan: ' + err.message, true); }
    });
  }

  // Login Page logic
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(loginForm);
      const username = form.get('username');
      const password = form.get('password');
      const msg = document.getElementById('message');
      setMessage(msg, 'Sedang login...');
      try {
        const res = await apiFetch(API.login, { method: 'POST', body: JSON.stringify({ username, password }) });
        storage.token = res.token;
        setMessage(msg, 'Login berhasil, mengalihkan...');
        setTimeout(() => go('/admin/dashboard'), 400);
      } catch(err){
        setMessage(msg, `Gagal login: ${err.message}`, true);
      }
    });

    // Jika sudah ada token, langsung ke dashboard
    if(storage.token){ go('/admin/dashboard'); }
  }

  // Dashboard logic
  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn){
    logoutBtn.addEventListener('click', () => { storage.clear(); go('/admin'); });
  }

  const status = document.getElementById('status');
  const usernameSpan = document.getElementById('username');
  const testProtectedBtn = document.getElementById('testProtected');
  const protectedResult = document.getElementById('protectedResult');

  async function ensureAuth(){
    if(!storage.token){ go('/admin'); return; }
    try {
      const me = await apiFetch(API.me);
      if(usernameSpan && me && me.user && me.user.sub){ usernameSpan.textContent = me.user.sub; }
      setMessage(status, 'Token valid.');
    } catch(err){
      setMessage(status, `Token invalid: ${err.message}`, true);
      storage.clear();
      setTimeout(() => go('/admin'), 600);
    }
  }

  if(status){ ensureAuth(); }

  if(testProtectedBtn && protectedResult){
    testProtectedBtn.addEventListener('click', async () => {
      setMessage(protectedResult, 'Memanggil /api/protected ...');
      try {
        const data = await apiFetch(API.protected);
        protectedResult.textContent = JSON.stringify(data, null, 2);
      } catch(err){
        protectedResult.textContent = 'Error: ' + err.message;
      }
    });
  }

  // DB Export/Import (API tab)
  const exportDbBtn = document.getElementById('exportDbBtn');
  const importDbBtn = document.getElementById('importDbBtn');
  const importDbFile = document.getElementById('importDbFile');
  const dbMsg = document.getElementById('dbMsg');

  async function handleExportDb(){
    if(!exportDbBtn) return;
    setMessage(dbMsg, 'Menyiapkan export...');
    try{
      const res = await fetch('/api/db/export', {
        headers: storage.token ? { 'Authorization': `Bearer ${storage.token}` } : {}
      });
      if(!res.ok) throw new Error((await res.text()) || res.statusText);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'db-export.json';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setMessage(dbMsg, 'Export siap diunduh.');
    }catch(err){ setMessage(dbMsg, 'Gagal export: ' + err.message, true); }
  }

  async function handleImportDb(){
    if(!importDbBtn) return;
    const file = importDbFile && importDbFile.files && importDbFile.files[0];
    if(!file){ setMessage(dbMsg, 'Pilih file JSON terlebih dulu.', true); return; }
    try{
      setMessage(dbMsg, 'Mengimpor...');
      const text = await file.text();
      const json = JSON.parse(text);
      const result = await apiFetch('/api/db/import', { method: 'POST', body: JSON.stringify(json) });
      setMessage(dbMsg, `Import selesai. songs=${result.counts?.songs||0}, categories=${result.counts?.categories||0}, playlists=${result.counts?.playlists||0}`);
    }catch(err){ setMessage(dbMsg, 'Gagal import: ' + err.message, true); }
  }

  if(exportDbBtn) exportDbBtn.addEventListener('click', handleExportDb);
  if(importDbBtn) importDbBtn.addEventListener('click', handleImportDb);

  // Songs Management
  const songsTable = document.getElementById('songsTable');
  const songsMsg = document.getElementById('songsMsg');
  const reloadSongsBtn = document.getElementById('reloadSongs');
  const importForm = document.getElementById('importForm');
  const importMsg = document.getElementById('importMsg');
  const addSongForm = document.getElementById('addSongForm');
  const addMsg = document.getElementById('addMsg');
  const addCategorySelect = document.getElementById('add_category');

  async function loadSongs(){
    if(!songsTable) return;
    setMessage(songsMsg, 'Memuat daftar lagu...');
    try {
      const data = await apiFetch(API.songs);
      const tbody = songsTable.querySelector('tbody');
      tbody.innerHTML = '';
      const items = (data && data.items) || [];
      if(items.length === 0){
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6; td.textContent = 'Belum ada lagu';
        tr.appendChild(td); tbody.appendChild(tr);
      } else {
        for(const s of items){
          const tr = document.createElement('tr');
          const title = document.createElement('td'); title.textContent = s.title || '-';
          const thumb = document.createElement('td'); thumb.innerHTML = s.thumbnail ? `<img src="${s.thumbnail}" alt="thumb" style="height:40px; border-radius:6px;"/>` : '-';
          const url = document.createElement('td'); url.innerHTML = s.url ? `<a href="${s.url}" target="_blank">link</a>` : '-';
          const cat = document.createElement('td');
          const catName = (categoriesCache.find(c => c.id === s.categoryId) || {}).name || '';
          cat.textContent = catName || '-';
          const src = document.createElement('td'); src.textContent = s.source || '-';
          const created = document.createElement('td'); created.textContent = s.createdAt ? new Date(s.createdAt).toLocaleString() : '-';
          const actions = document.createElement('td');
          const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Edit'; edit.style.marginRight = '8px';
          edit.addEventListener('click', () => openEditModal(s));
          const del = document.createElement('button'); del.type = 'button'; del.textContent = 'Hapus'; del.className = 'outline';
          del.addEventListener('click', async () => {
            if(!confirm('Yakin hapus lagu ini?')) return;
            try{
              await apiFetch(`${API.songs}/${s.id}`, { method: 'DELETE' });
              await loadSongs();
            }catch(err){ setMessage(songsMsg, 'Gagal hapus: ' + err.message, true); }
          });
          actions.appendChild(edit);
          actions.appendChild(del);
          tr.appendChild(title); tr.appendChild(thumb); tr.appendChild(url); tr.appendChild(cat); tr.appendChild(src); tr.appendChild(created); tr.appendChild(actions);
          tbody.appendChild(tr);
        }
      }
      setMessage(songsMsg, '');
    } catch(err){
      setMessage(songsMsg, 'Gagal memuat: ' + err.message, true);
    }
  }

  if(reloadSongsBtn){ reloadSongsBtn.addEventListener('click', loadSongs); }
  if(songsTable){ loadSongs(); }

  if(importForm){
    importForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(importForm);
      const youtubeUrl = form.get('youtubeUrl');
      setMessage(importMsg, 'Mengimpor dari YouTube...');
      try{
        await apiFetch(API.songsImport, { method: 'POST', body: JSON.stringify({ youtubeUrl }) });
        setMessage(importMsg, 'Berhasil impor.');
        importForm.reset();
        await loadSongs();
      }catch(err){ setMessage(importMsg, 'Gagal impor: ' + err.message, true); }
    });
  }

  if(addSongForm){
    addSongForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(addSongForm);
      const payload = {
        url: form.get('url'),
        title: form.get('title'),
        source: 'manual'
      };
      const d = form.get('durationSeconds');
      if(d && String(d).trim().length > 0) payload.durationSeconds = Number(d);
      const cat = (form.get('categoryId') || '').trim();
      if(cat.length > 0) payload.categoryId = cat; else payload.categoryId = null;
      setMessage(addMsg, 'Menambah lagu...');
      try{
        await apiFetch(API.songs, { method: 'POST', body: JSON.stringify(payload) });
        setMessage(addMsg, 'Berhasil menambah.');
        addSongForm.reset();
        await loadSongs();
      }catch(err){ setMessage(addMsg, 'Gagal menambah: ' + err.message, true); }
    });
  }

  // Keep Add form category select in sync when categories load
  function populateAddCategorySelect(){
    if(!addCategorySelect) return;
    addCategorySelect.innerHTML = '<option value="">(Tidak ada)</option>' +
      categoriesCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
})();
