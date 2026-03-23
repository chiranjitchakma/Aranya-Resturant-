// ── CART ──
var CKEY = 'aranyaGarden_v3';
var cart = {};

function loadCart(){try{var s=localStorage.getItem(CKEY);if(s)cart=JSON.parse(s);}catch(e){cart={};}}
function saveCart(){try{localStorage.setItem(CKEY,JSON.stringify(cart));}catch(e){}}
function cartTotal(){return Object.values(cart).reduce(function(s,v){return s+v.p*v.q;},0);}
function cartCount(){return Object.values(cart).reduce(function(s,v){return s+v.q;},0);}
function updateBadge(){
  var b=document.getElementById('cbadge'),n=cartCount();
  if(b){b.textContent=n;b.className=n>0?'on':'';}
}
function addToCart(name,price){
  if(cart[name])cart[name].q++;else cart[name]={p:price,q:1};
  saveCart();updateBadge();syncCards();renderCart();
  var f=document.getElementById('cart-fab');
  if(f){f.classList.remove('pulse');void f.offsetWidth;f.classList.add('pulse');}
  toast('Added to cart 🛒');
}
function changeQty(name,d){
  if(!cart[name])return;
  cart[name].q+=d;
  if(cart[name].q<=0)delete cart[name];
  saveCart();updateBadge();syncCards();renderCart();
}
function renderCart(){
  var body=document.getElementById('cbody'),ftr=document.getElementById('cftr');
  if(!body)return;
  var entries=Object.entries(cart);
  if(!entries.length){
    body.innerHTML='<div class="cempty"><div class="em-ico">🌿</div><p>Your cart is empty</p><p style="font-size:var(--sm);margin-top:.3rem">Add items from the menu</p></div>';
    if(ftr)ftr.style.display='none';return;
  }
  if(ftr){ftr.style.display='block';}
  var tot=document.getElementById('ctotal');if(tot)tot.textContent='₹'+cartTotal();
  body.innerHTML=entries.map(function(e){
    var name=e[0],v=e[1];
    return '<div class="citem"><div class="cin">'+esc(name)+'</div><div class="cictl">'+
      '<button class="cqb" onclick="changeQty(\''+ea(name)+'\', -1)">−</button>'+
      '<span class="cqn">'+v.q+'</span>'+
      '<button class="cqb" onclick="changeQty(\''+ea(name)+'\', 1)">+</button>'+
      '<button class="cdel" onclick="changeQty(\''+ea(name)+'\', -'+v.q+')" aria-label="Remove">🗑</button>'+
      '</div><div class="cprice">₹'+v.p*v.q+'</div></div>';
  }).join('');
}

// ── CART OPEN / CLOSE ──
function openCart(){
  renderCart();
  var panel=document.getElementById('cart-panel');
  var overlay=document.getElementById('cart-overlay');
  if(panel){panel.classList.add('on');panel.setAttribute('aria-hidden','false');}
  if(overlay)overlay.classList.add('on');
  document.body.style.overflow='hidden';
  // Init map after panel is visible (needs DOM dimensions)
  setTimeout(_initMap, 120);
}
function closeCart(){
  var panel=document.getElementById('cart-panel');
  var overlay=document.getElementById('cart-overlay');
  if(panel){panel.classList.remove('on');panel.setAttribute('aria-hidden','true');}
  if(overlay)overlay.classList.remove('on');
  document.body.style.overflow=''; // restore scroll
}

// ── MENU RENDER ──
function renderMenus(){
  Object.keys(MENU).forEach(function(cat){
    var g=document.getElementById('grid-'+cat);
    if(!g)return;
    g.innerHTML=MENU[cat].map(function(item){
      var q=cart[item.n]?cart[item.n].q:0;
      return '<article class="mcard fade-in">'+
        '<div class="mcb">'+
        (item.best?'<span class="badge badge-amber">⭐ Best</span>':'')+
        (item.limited?'<span class="badge badge-red">📅 Mon/Wed/Fri</span>':'')+
        '</div>'+
        '<div class="memo">'+item.e+'</div>'+
        '<div class="mname">'+esc(item.n)+'</div>'+
        '<div class="mdesc">'+(item.d?esc(item.d):'')+'</div>'+
        '<div class="mfoot">'+
        '<span class="mprice">₹'+item.p+'</span>'+
        '<div id="cc-'+cid(item.n)+'">'+ctrlHTML(item.n,item.p,q)+'</div>'+
        '</div></article>';
    }).join('');
  });
}
function ctrlHTML(name,price,q){
  if(q===0)return '<button class="add-btn" onclick="addToCart(\''+ea(name)+'\','+price+')">+ Add</button>';
  return '<div class="qc on"><button class="qb" onclick="changeQty(\''+ea(name)+'\', -1)">−</button><span class="qn">'+q+'</span><button class="qb" onclick="changeQty(\''+ea(name)+'\', 1)">+</button></div>';
}
function syncCards(){
  Object.keys(MENU).forEach(function(cat){
    MENU[cat].forEach(function(item){
      var el=document.getElementById('cc-'+cid(item.n));
      if(el)el.innerHTML=ctrlHTML(item.n,item.p,cart[item.n]?cart[item.n].q:0);
      // Also sync search result controls
      var sel=document.getElementById('src-'+cid(item.n));
      if(sel)sel.innerHTML=ctrlHTML(item.n,item.p,cart[item.n]?cart[item.n].q:0);
    });
  });
}

// ── TABS ──
function switchTab(btn,cat){
  document.querySelectorAll('.cat').forEach(function(s){s.classList.remove('active');});
  document.querySelectorAll('.tab').forEach(function(b){b.classList.remove('active');});
  var sec=document.getElementById('cat-'+cat);if(sec)sec.classList.add('active');
  if(btn)btn.classList.add('active');
  initFadeIn();
}

// ── ORDER ──
function validateForm(){
  var ok = true;
  var name  = document.getElementById('cname').value.trim();
  var phone = document.getElementById('cphone').value.trim();
  var area  = (document.getElementById('addr-search') || {}).value || '';
  area = area.trim();
  var flat  = document.getElementById('caddr').value.trim();

  function setErr(id, eid, show) {
    var el = document.getElementById(id), er = document.getElementById(eid);
    if (el) el.classList.toggle('err', show);
    if (er) er.classList.toggle('on', show);
    if (show) ok = false;
  }

  setErr('cname',  'err-name',  name.length < 2);
  setErr('cphone', 'err-phone', !/^[6-9]\d{9}$/.test(phone));

  /* area search must be filled */
  var searchInp = document.getElementById('addr-search');
  if (searchInp) searchInp.classList.toggle('err', area.length < 3);
  var searchErr = document.getElementById('err-addr');
  if (area.length < 3) {
    if (searchErr) { searchErr.textContent = 'Please search and select your area.'; searchErr.classList.add('on'); }
    ok = false;
  } else if (searchErr) { searchErr.classList.remove('on'); }

  /* flat number must be filled */
  setErr('caddr', 'err-addr2', flat.length < 2);

  /* pin must be placed (not sitting on restaurant) */
  if (_locState.lat === null) {
    if (!ok) { /* already failing */ }
    /* allow ordering without pin if address filled — just no distance check */
  }

  /* if pin placed and outside range — block */
  if (_locState.checked && !_locState.withinRange) {
    if (searchInp) searchInp.classList.add('err');
    if (searchErr) { searchErr.textContent = 'Outside 5 km delivery range.'; searchErr.classList.add('on'); }
    ok = false;
  }
  return ok;
}


// ── WHATSAPP ──
function waOpen(){window.open('https://wa.me/'+WA+'?text='+encodeURIComponent("Hello Aranya Garden! I'd like to place an order."),'_blank','noopener,noreferrer');}
function sendWA(){
  var msg = document.getElementById('ct-msg').value.trim();
  var name = document.getElementById('ct-name').value.trim();
  if(!msg){ toast('Please type a message', 'err'); return; }
  var text = '🌿 *Aranya Garden Enquiry*\n\n';
  if(name) text += '👤 Name: ' + name + '\n';
  text += '📝 Message: ' + msg;
  window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
}

// ── STATUS ──
function updateStatus(){
  var now=new Date();
  var ist=new Date(now.toLocaleString('en-US',{timeZone:'Asia/Kolkata'}));
  var m=ist.getHours()*60+ist.getMinutes();
  var open=m>=420&&m<1350; // 7:00 AM to 10:30 PM
  var dot=document.getElementById('sdot'),txt=document.getElementById('stext'),hs=document.getElementById('hrs-status');
  if(dot)dot.className='sdot '+(open?'open':'closed');
  if(txt)txt.textContent=open?'Open Now · Closes 10:30 PM':'Closed · Opens 7:00 AM';
  if(hs)hs.innerHTML='<span class="badge '+(open?'badge-green':'badge-red')+'">'+(open?'🟢 Open Now':'🔴 Closed · Opens 7:00 AM')+'</span>';
}

// ── NAV ──
function goTo(id){
  var el=document.getElementById(id);
  if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
}
function mobGoTo(id){
  closeMobNav();
  setTimeout(function(){goTo(id);},330);
}

// ── MOBILE NAV ──
function closeMobNav(){
  var nav=document.getElementById('mob-nav'),ham=document.getElementById('ham');
  if(nav){nav.classList.remove('open');nav.setAttribute('aria-hidden','true');}
  if(ham){ham.classList.remove('open');ham.setAttribute('aria-expanded','false');}
}
function initMobNav(){
  var ham=document.getElementById('ham'),nav=document.getElementById('mob-nav');
  if(!ham||!nav)return;
  ham.addEventListener('click',function(){
    var isOpen=nav.classList.toggle('open');
    ham.classList.toggle('open',isOpen);
    ham.setAttribute('aria-expanded',isOpen);
    nav.setAttribute('aria-hidden',!isOpen);
  });
}

// ── STICKY NAV ──
function initStickyNav(){
  var nav=document.getElementById('navbar');
  if(!nav)return;
  window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',window.scrollY>80);},{passive:true});
}

// ── FADE IN ──
function initFadeIn(){
  if(!window.IntersectionObserver){
    document.querySelectorAll('.fade-in').forEach(function(el){el.classList.add('visible');});
    return;
  }
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}}); 
  },{threshold:0.08});
  document.querySelectorAll('.fade-in:not(.visible)').forEach(function(el){obs.observe(el);});
}

// ── TOAST ──
function toast(msg,type){
  var t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;t.className=type?'show terr':'show';
  clearTimeout(window._tt);window._tt=setTimeout(function(){t.className='';},2800);
}

// ── HELPERS ──
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function ea(s){return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");}
function cid(s){return s.replace(/[^a-zA-Z0-9]/g,'_');}

// ── KEYBOARD ──
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){closeCart();closeMobNav();}
});

// ── INIT — everything wrapped in try-catch so one error never blanks the page ──

/* ── MENU SEARCH ── */
var _searchTimer = null;

function handleMenuSearch(raw) {
  // Security: sanitize input — strip HTML, limit length
  var q = String(raw).replace(/<[^>]*>/g, '').replace(/[^\w\s\u0900-\u097F.,!@#%&*()\-]/g, '').trim().slice(0, 60);
  var clearBtn = document.getElementById('search-clear');
  var tabsArea = document.getElementById('tabs-area');
  var resultsArea = document.getElementById('search-results-section');

  if (clearBtn) clearBtn.classList.toggle('show', q.length > 0);

  // Debounce: wait 180ms after last keystroke
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(function() {
    if (q.length === 0) {
      if (resultsArea) resultsArea.classList.remove('show');
      if (tabsArea) tabsArea.style.display = '';
      return;
    }

    if (tabsArea) tabsArea.style.display = 'none';
    if (resultsArea) resultsArea.classList.add('show');
    _runSearch(q);
  }, 180);
}

function _runSearch(q) {
  var ql = q.toLowerCase();
  var results = [];

  Object.keys(MENU).forEach(function(cat) {
    MENU[cat].forEach(function(item) {
      var nameLower = item.n.toLowerCase();
      var descLower = (item.d || '').toLowerCase();
      if (nameLower.indexOf(ql) !== -1 || descLower.indexOf(ql) !== -1) {
        results.push({ item: item, cat: cat });
      }
    });
  });

  var grid = document.getElementById('search-results-grid');
  var empty = document.getElementById('search-empty');
  var countEl = document.getElementById('search-count');
  var labelEl = document.getElementById('search-query-label');

  if (countEl) countEl.textContent = results.length + ' item' + (results.length !== 1 ? 's' : '') + ' found';
  if (labelEl) labelEl.textContent = 'for "' + esc(q) + '"';

  if (results.length === 0) {
    if (grid) grid.innerHTML = '';
    if (empty) empty.style.display = '';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (!grid) return;

  grid.innerHTML = results.map(function(r) {
    var item = r.item;
    var q2 = cart[item.n] ? cart[item.n].q : 0;
    var hilName = _highlight(esc(item.n), esc(q));
    var hilDesc = item.d ? _highlight(esc(item.d), esc(q)) : '';
    return '<article class="mcard">' +
      '<div class="mcb">' +
      (item.best ? '<span class="badge badge-amber">⭐ Best</span>' : '') +
      (item.limited ? '<span class="badge badge-red">📅 Mon/Wed/Fri</span>' : '') +
      '</div>' +
      '<div class="memo">' + item.e + '</div>' +
      '<div class="mname">' + hilName + '</div>' +
      '<div class="mdesc">' + hilDesc + '</div>' +
      '<div class="mfoot">' +
      '<span class="mprice">₹' + item.p + '</span>' +
      '<div id="src-' + cid(item.n) + '">' + ctrlHTML(item.n, item.p, q2) + '</div>' +
      '</div></article>';
  }).join('');
}

function _highlight(text, query) {
  if (!query) return text;
  // Case-insensitive highlight — safe because both args are already esc()d
  var re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

function clearMenuSearch() {
  var inp = document.getElementById('menu-search');
  if (inp) { inp.value = ''; inp.focus(); }
  var clearBtn = document.getElementById('search-clear');
  if (clearBtn) clearBtn.classList.remove('show');
  var tabsArea = document.getElementById('tabs-area');
  if (tabsArea) tabsArea.style.display = '';
  var resultsArea = document.getElementById('search-results-section');
  if (resultsArea) resultsArea.classList.remove('show');
}

// Keyboard shortcut: press / to focus search when not in input
document.addEventListener('keydown', function(e) {
  if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
    var s = document.getElementById('menu-search');
    if (s) { goTo('menu'); setTimeout(function() { s.focus(); }, 400); }
  }
});


/* ── DELIVERY LOCATION & DISTANCE ── */
var RESTAURANT         = { lat: 12.3053, lng: 76.6551 };
var DELIVERY_RADIUS_KM = 5;
var _locState = { lat: null, lng: null, checked: false, withinRange: false };
var _map      = null;
var _marker   = null;
var _sugTimer = null;

/* ── Haversine distance (km) ── */
function _haversine(lat1, lon1, lat2, lon2) {
  var R = 6371, toRad = Math.PI / 180;
  var dLat = (lat2 - lat1) * toRad, dLon = (lon2 - lon1) * toRad;
  var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
          Math.cos(lat1*toRad)*Math.cos(lat2*toRad)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/* ── Distance badge ── */
function _setDistBadge(distKm) {
  var badge    = document.getElementById('dist-badge');
  var noDelMsg = document.getElementById('no-delivery-msg');
  var placeBtn = document.querySelector('.place-btn');
  if (!badge) return;
  if (distKm === null) {
    badge.className = '';
    if (noDelMsg) noDelMsg.classList.remove('show');
    return;
  }
  var within = distKm <= DELIVERY_RADIUS_KM;
  _locState.withinRange = within;
  _locState.checked     = true;
  badge.className = '';
  badge.classList.add('show');
  badge.classList.toggle('ok',  within);
  badge.classList.toggle('far', !within);
  badge.innerHTML = within
    ? '✅ ' + distKm.toFixed(1) + ' km — Delivery available'
    : '⚠️ ' + distKm.toFixed(1) + ' km — Outside 5 km range';
  if (noDelMsg) noDelMsg.classList.toggle('show', !within);
  if (placeBtn) placeBtn.disabled = !within;
}

/* ── Move pin to lat/lng, calculate distance ── */
function _placePin(lat, lng) {
  _locState.lat = lat;
  _locState.lng = lng;
  if (_map && _marker) {
    _marker.setLatLng([lat, lng]);
    _map.setView([lat, lng], 16);
  }
  _setDistBadge(_haversine(lat, lng, RESTAURANT.lat, RESTAURANT.lng));
}

/* ── Init Leaflet map ── */
function _initMap() {
  if (_map) { setTimeout(function(){ _map.invalidateSize(); }, 60); return; }
  var el = document.getElementById('map-picker');
  if (!el || typeof L === 'undefined') return;

  _map = L.map('map-picker', { zoomControl: true, attributionControl: false })
           .setView([RESTAURANT.lat, RESTAURANT.lng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              { maxZoom: 19 }).addTo(_map);

  /* restaurant fixed marker */
  L.marker([RESTAURANT.lat, RESTAURANT.lng], {
    icon: L.divIcon({ html:'<div style="font-size:1.5rem">🏪</div>',
                      className:'', iconAnchor:[12,24] }),
    title: 'Aranya Garden'
  }).addTo(_map).bindPopup('<b>Aranya Garden</b><br>Saraswathipuram, Mysuru');

  /* draggable customer marker */
  _marker = L.marker([RESTAURANT.lat, RESTAURANT.lng], {
    icon: L.divIcon({ html:'<div style="font-size:1.8rem">📍</div>',
                      className:'', iconAnchor:[10,32] }),
    draggable: true,
    title: 'Your location — drag to adjust'
  }).addTo(_map);
  _marker.bindPopup('Your delivery location').openPopup();

  function onPinMoved() {
    var ll = _marker.getLatLng();
    _locState.lat = ll.lat; _locState.lng = ll.lng;
    _setDistBadge(_haversine(ll.lat, ll.lng, RESTAURANT.lat, RESTAURANT.lng));
  }
  _marker.on('drag',    onPinMoved);
  _marker.on('dragend', onPinMoved);
  _map.on('click', function(e) {
    _marker.setLatLng(e.latlng);
    _locState.lat = e.latlng.lat; _locState.lng = e.latlng.lng;
    _setDistBadge(_haversine(e.latlng.lat, e.latlng.lng, RESTAURANT.lat, RESTAURANT.lng));
  });

  setTimeout(function(){ _map.invalidateSize(); }, 60);
}

/* ── Address search (Swiggy-style live suggestions) ── */
function onAddrSearch(val) {
  var box = document.getElementById('addr-suggestions');
  if (!box) return;
  clearTimeout(_sugTimer);
  var q = val.trim();
  if (q.length < 3) {
    box.innerHTML = '';
    box.classList.remove('show');
    return;
  }
  box.innerHTML = '<div class="addr-sug-loading">🔍 Searching…</div>';
  box.classList.add('show');

  _sugTimer = setTimeout(function() {
    var query = (/mysuru|mysore|karnataka/i.test(q)) ? q : q + ' Mysuru Karnataka India';
    var url = 'https://nominatim.openstreetmap.org/search?format=json' +
              '&q=' + encodeURIComponent(query) +
              '&limit=6&addressdetails=1&countrycodes=in';

    fetch(url, { headers: { 'Accept-Language': 'en' } })
    .then(function(r) { return r.json(); })
    .then(function(results) {
      if (!results || !results.length) {
        box.innerHTML = '<div class="addr-sug-empty">No results — try a nearby landmark</div>';
        return;
      }
      box.innerHTML = '';
      results.forEach(function(r) {
        var parts = r.display_name.split(',');
        var main  = esc(parts[0].trim());
        var sub   = esc(parts.slice(1, 4).join(',').trim());
        var item  = document.createElement('div');
        item.className   = 'addr-sug-item';
        item.tabIndex    = 0;
        item.innerHTML   = '<span class="addr-sug-icon">📍</span>' +
                           '<div><div class="addr-sug-main">' + main + '</div>' +
                           '<div class="addr-sug-sub">' + sub + '</div></div>';
        item.dataset.lat  = r.lat;
        item.dataset.lon  = r.lon;
        item.dataset.name = r.display_name;
        item.addEventListener('click', function() {
          _pickSuggestion(parseFloat(this.dataset.lat),
                          parseFloat(this.dataset.lon),
                          this.dataset.name);
        });
        item.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            _pickSuggestion(parseFloat(this.dataset.lat),
                            parseFloat(this.dataset.lon),
                            this.dataset.name);
          }
        });
        box.appendChild(item);
      });
    })
    .catch(function() {
      box.innerHTML = '<div class="addr-sug-empty">Search unavailable — use map pin below</div>';
    });
  }, 400);
}

function _pickSuggestion(lat, lng, displayName) {
  var inp = document.getElementById('addr-search');
  if (inp) inp.value = displayName.split(',').slice(0, 3).join(',').trim();
  var box = document.getElementById('addr-suggestions');
  if (box) { box.innerHTML = ''; box.classList.remove('show'); }
  _placePin(lat, lng);
}


function detectLocation() {
  if (detectLocation._busy) return;
  detectLocation._busy = true;
  setTimeout(function(){ detectLocation._busy = false; }, 3000);

  if (!navigator.geolocation) { toast('GPS not supported', 'err'); return; }

  var btn = document.getElementById('loc-btn');
  var txt = document.getElementById('loc-btn-txt');
  if (btn) btn.disabled = true;
  if (txt) txt.innerHTML = '<span class="spin">⏳</span>';

  navigator.geolocation.getCurrentPosition(
    function(pos) {
      var lat = pos.coords.latitude, lng = pos.coords.longitude;
      _placePin(lat, lng);

      /* reverse geocode → fill search box */
      _reverseGeocode(lat, lng, function(addr) {
        var inp = document.getElementById('addr-search');
        if (inp && addr) inp.value = addr;
        if (btn) btn.disabled = false;
        if (txt) txt.textContent = 'Detect';
        toast('📍 Location detected — drag pin to adjust');
      });
    },
    function(err) {
      if (btn) btn.disabled = false;
      if (txt) txt.textContent = 'Detect';
      var msgs = { 1:'Location denied — allow in browser settings.',
                   2:'Could not get GPS. Check your connection.',
                   3:'GPS timed out. Try again.' };
      toast(msgs[err.code] || 'Location unavailable.', 'err');
    },
    { timeout: 12000, maximumAge: 30000, enableHighAccuracy: true }
  );
}

/* ── Reverse geocode for GPS → address text ── */
function _reverseGeocode(lat, lng, cb) {
  fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' +
        encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lng) +
        '&zoom=17&addressdetails=1',
        { headers: { 'Accept-Language': 'en' } })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (!d || !d.address) { cb(''); return; }
    var a = d.address, parts = [];
    var lm = a.amenity || a.shop || a.building || '';
    if (lm) parts.push(lm);
    if (a.house_number) parts.push(a.house_number);
    var st = a.road || a.pedestrian || a.path || '';
    if (st) parts.push(st);
    var ar = a.quarter || a.neighbourhood || a.suburb || '';
    if (ar) parts.push(ar);
    var ci = a.city || a.town || a.municipality || a.village || '';
    if (ci) parts.push(ci);
    cb(parts.filter(Boolean).join(', ') || d.display_name || '');
  })
  .catch(function() { cb(''); });
}

/* ── Close suggestions when clicking outside ── */
document.addEventListener('click', function(e) {
  if (!e.target.closest('.addr-search-wrap')) {
    var box = document.getElementById('addr-suggestions');
    if (box) { box.innerHTML = ''; box.classList.remove('show'); }
  }
});

/* ── onAddrInput: kept for compatibility (no-op now) ── */
function onAddrInput() {}

document.addEventListener('DOMContentLoaded',function(){
  try{loadCart();}catch(e){console.warn('loadCart',e);cart={};}
  try{renderMenus();}catch(e){console.error('renderMenus',e);}
  try{updateStatus();setInterval(updateStatus,60000);}catch(e){}
  try{initStickyNav();}catch(e){}
  try{initMobNav();}catch(e){}
  try{updateBadge();}catch(e){}
  try{initFadeIn();setTimeout(initFadeIn,600);}catch(e){}

  // WhatsApp buttons
  try{
    ['nav-wa','hero-wa','mob-wa','apps-wa'].forEach(function(id){
      var el=document.getElementById(id);
      if(el&&id!=='mob-wa')el.addEventListener('click',function(e){e.preventDefault();waOpen();});
    });
  }catch(e){}

  // Swiggy placeholder
  try{
    var sw=document.getElementById('swiggy-btn');
    if(sw)sw.addEventListener('click',function(){toast('Swiggy link coming soon!');} );
  }catch(e){}

  // Scroll to top button
  try{
    var topBtn=document.getElementById('go-top');
    if(topBtn){
      window.addEventListener('scroll',function(){
        topBtn.classList.toggle('show',window.scrollY>320);
      },{passive:true});
      topBtn.addEventListener('click',function(){
        window.scrollTo({top:0,behavior:'smooth'});
      });
    }
  }catch(e){}
});



/* ── PLACE ORDER ── */
function placeOrder() {
  if (!validateForm()) return;

  // Location range check (only when GPS was used)
  if (_locState.checked && !_locState.withinRange) {
    toast('🚫 Outside delivery range. We cannot deliver here.', 'err');
    return;
  }

  var name  = document.getElementById('cname').value.trim();
  var phone = document.getElementById('cphone').value.trim();
  var addr  = document.getElementById('caddr').value.trim();

  var items = Object.entries(cart).map(function(e) {
    return '• ' + e[0] + ' × ' + e[1].q + ' — ₹' + (e[1].p * e[1].q);
  }).join('\n');

  var area  = document.getElementById('addr-search') ? document.getElementById('addr-search').value.trim() : '';
  var fullAddr = (area ? area + ', ' : '') + addr;

  var locLine = '';
  if (_locState.lat !== null) {
    var dist = _haversine(_locState.lat, _locState.lng, RESTAURANT.lat, RESTAURANT.lng);
    var mapsUrl = 'https://www.google.com/maps?q=' + _locState.lat.toFixed(6) + ',' + _locState.lng.toFixed(6);
    locLine = '\n📏 Distance: ' + dist.toFixed(1) + ' km' +
              '\n🗺️ Location: ' + mapsUrl;
  }

  var msg = '🌿 *New Order — Aranya Garden*\n\n' +
            '📋 *Items:*\n' + items + '\n\n' +
            '💰 *Total: ₹' + cartTotal() + '*\n\n' +
            '👤 *Customer:*\n' +
            'Name: '    + name     + '\n' +
            'Phone: '   + phone    + '\n' +
            'Address: ' + fullAddr + locLine + '\n\n' +
            '💳 Payment: Cash on Delivery\n' +
            '⏱ Kindly confirm. Thank you!';

  closeCart();
  window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
  cart = {}; saveCart(); updateBadge(); syncCards(); renderCart();
  toast('Order sent to WhatsApp! 🎉');
}
