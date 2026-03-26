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
  var orderBar=document.getElementById('cart-order-bar');
  if(!body)return;
  var entries=Object.entries(cart);
  if(!entries.length){
    body.innerHTML='<div class="cempty"><div class="em-ico">🌿</div><p>Your cart is empty</p><p style="font-size:var(--sm);margin-top:.3rem">Add items from the menu</p></div>';
    if(ftr)ftr.style.display='none';
    if(orderBar)orderBar.style.display='none';
    return;
  }
  if(ftr){ftr.style.display='block';}
  if(orderBar){orderBar.style.display='block';}
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

  /* if pin placed AND outside range — block */
  if (_locState.checked && !_locState.withinRange) {
    if (searchInp) searchInp.classList.add('err');
    if (searchErr) { searchErr.textContent = '🚫 Outside 5 km delivery range.'; searchErr.classList.add('on'); }
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
var _locState = {
  lat: null, lng: null,
  checked: false, withinRange: false,
  pinPlaced: false,
  pinAddr: ''       /* address derived from pin coords — single source of truth */
};
var _map      = null;
var _marker   = null;
var _sugTimer = null;

/* ════════════════════════════════════════════
   DISTANCE HELPERS
   ════════════════════════════════════════════ */

function _haversine(lat1, lon1, lat2, lon2) {
  var R = 6371, r = Math.PI / 180;
  var dL = (lat2-lat1)*r, dN = (lon2-lon1)*r;
  var a  = Math.sin(dL/2)*Math.sin(dL/2) +
           Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dN/2)*Math.sin(dN/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function _setDistBadge(distKm) {
  var badge    = document.getElementById('dist-badge');
  var noDelMsg = document.getElementById('no-delivery-msg');
  var placeBtn = document.querySelector('.place-btn');
  if (!badge) return;
  if (distKm === null) {
    badge.className   = 'pending';
    badge.innerHTML   = '📍 Move the pin to your location to check delivery';
    if (noDelMsg) noDelMsg.classList.remove('show');
    if (placeBtn) placeBtn.disabled = false;
    return;
  }
  var ok = distKm <= DELIVERY_RADIUS_KM;
  _locState.withinRange = ok;
  _locState.checked     = true;
  badge.className = 'show ' + (ok ? 'ok' : 'far');
  badge.innerHTML = ok
    ? '✅ ' + distKm.toFixed(1) + ' km away — Delivery available 🛵'
    : '⚠️ ' + distKm.toFixed(1) + ' km away — Outside 5 km delivery range';
  if (noDelMsg) noDelMsg.classList.toggle('show', !ok);
  if (placeBtn) placeBtn.disabled = !ok;
}

/* ════════════════════════════════════════════
   REVERSE GEOCODE  — lat/lng → address text
   All place types: hospital, petrol pump,
   school, hotel, park, shop, office, etc.
   ════════════════════════════════════════════ */

function _reverseGeocode(lat, lng, cb) {
  var url = 'https://nominatim.openstreetmap.org/reverse?format=json' +
            '&lat=' + lat + '&lon=' + lng +
            '&zoom=18&addressdetails=1';
  fetch(url, { headers: { 'Accept-Language': 'en' } })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (!d || !d.address) { cb('', ''); return; }
    var a = d.address;
    /* place/building name — every known Nominatim type */
    var place =
      a.amenity    || a.tourism  || a.leisure  || a.shop     ||
      a.fuel       || a.office   || a.building || a.healthcare||
      a.military   || a.historic || a.man_made || '';
    /* street parts */
    var parts = [];
    if (a.house_number) parts.push(a.house_number);
    var st = a.road || a.pedestrian || a.path || a.footway || a.service || '';
    if (st) parts.push(st);
    var ar = a.quarter || a.neighbourhood || a.suburb || a.residential || '';
    if (ar) parts.push(ar);
    var ci = a.city || a.town || a.municipality || a.village || '';
    if (ci) parts.push(ci);
    if (a.state)    parts.push(a.state);
    if (a.postcode) parts.push(a.postcode);
    var street = parts.filter(Boolean).join(', ') || d.display_name || '';
    cb(street, place);
  })
  .catch(function() { cb('', ''); });
}

/* ════════════════════════════════════════════
   MAP INIT
   ════════════════════════════════════════════ */

function _initMap() {
  if (_map) { setTimeout(function(){ _map.invalidateSize(); }, 60); return; }
  var el = document.getElementById('map-picker');
  if (!el || typeof L === 'undefined') return;

  _map = L.map('map-picker', { zoomControl: true, attributionControl: false })
           .setView([RESTAURANT.lat, RESTAURANT.lng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              { maxZoom: 19 }).addTo(_map);

  /* fixed restaurant marker */
  L.marker([RESTAURANT.lat, RESTAURANT.lng], {
    icon:  L.divIcon({ html: '<div style="font-size:1.5rem">🏪</div>',
                       className: '', iconAnchor: [12, 24] }),
    title: 'Aranya Garden'
  }).addTo(_map)
    .bindPopup('<b>Aranya Garden</b><br>Saraswathipuram, Mysuru');

  /* draggable customer marker */
  _marker = L.marker([12.2958, 76.6394], {          /* Mysuru city centre */
    icon: L.divIcon({
      html: '<div style="font-size:2rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))">📍</div>',
      className: '', iconAnchor: [12, 36]
    }),
    draggable: true,
    title: 'Drag to your location'
  }).addTo(_map);
  _marker.bindPopup('<b>Your location</b><br>Drag to adjust').openPopup();

  /* live distance while dragging */
  _marker.on('drag', function() {
    var ll = _marker.getLatLng();
    _locState.lat = ll.lat; _locState.lng = ll.lng;
    _setDistBadge(_haversine(ll.lat, ll.lng, RESTAURANT.lat, RESTAURANT.lng));
  });

  /* dragend → distance + fill address from pin */
  _marker.on('dragend', function() {
    var ll = _marker.getLatLng();
    _locState.lat = ll.lat; _locState.lng = ll.lng;
    _locState.pinPlaced = true;
    _setDistBadge(_haversine(ll.lat, ll.lng, RESTAURANT.lat, RESTAURANT.lng));
    _syncAddrFromPin(ll.lat, ll.lng);
  });

  /* tap map → move pin + fill address */
  _map.on('click', function(e) {
    _marker.setLatLng(e.latlng);
    _locState.lat = e.latlng.lat; _locState.lng = e.latlng.lng;
    _locState.pinPlaced = true;
    _setDistBadge(_haversine(e.latlng.lat, e.latlng.lng, RESTAURANT.lat, RESTAURANT.lng));
    _syncAddrFromPin(e.latlng.lat, e.latlng.lng);
  });

  setTimeout(function(){ _map.invalidateSize(); }, 100);
  setTimeout(function(){ _map.invalidateSize(); }, 400);
}

/* ════════════════════════════════════════════
   _syncAddrFromPin
   Reverse-geocodes lat/lng, stores result in
   _locState.pinAddr AND fills the UI fields.
   Called after EVERY pin movement.
   ════════════════════════════════════════════ */
function _syncAddrFromPin(lat, lng) {
  _reverseGeocode(lat, lng, function(street, place) {
    /* canonical address = from pin coords → single source of truth */
    _locState.pinAddr = street;

    /* fill search box (editable by customer) */
    var si = document.getElementById('addr-search');
    if (si) {
      si.value = street;
      si.classList.remove('err');
      var se = document.getElementById('err-addr');
      if (se) se.classList.remove('on');
    }
    /* fill building field only if empty */
    var bi = document.getElementById('cbuild');
    if (bi && place && !bi.value) bi.value = place;
  });
}

/* ════════════════════════════════════════════
   _movePinTo(lat, lng, addrText)
   Moves map marker to position + stores addr.
   addrText = already-known address (no extra
   geocode needed when coming from dropdown).
   ════════════════════════════════════════════ */
function _movePinTo(lat, lng, addrText) {
  _locState.lat       = lat;
  _locState.lng       = lng;
  _locState.pinPlaced = true;
  _locState.pinAddr   = addrText;   /* store right now — no async */

  if (_map && _marker) {
    _marker.setLatLng([lat, lng]);
    _map.setView([lat, lng], 17);
    _marker.openPopup();
  }
  _setDistBadge(_haversine(lat, lng, RESTAURANT.lat, RESTAURANT.lng));
}

/* ════════════════════════════════════════════
   ADDRESS SEARCH  (Swiggy-style dropdown)
   ════════════════════════════════════════════ */

function onAddrSearch(val) {
  var box = document.getElementById('addr-suggestions');
  if (!box) return;
  clearTimeout(_sugTimer);
  var q = val.trim();
  if (q.length < 3) {
    box.innerHTML = ''; box.classList.remove('show'); return;
  }
  box.innerHTML = '<div class="addr-sug-loading">🔍 Searching…</div>';
  box.classList.add('show');

  _sugTimer = setTimeout(function() {
    /* bias toward Mysuru; try with & without city suffix */
    var withCity = /mysuru|mysore|karnataka/i.test(q) ? q : q + ', Mysuru';
    var url = 'https://nominatim.openstreetmap.org/search?format=json' +
              '&q=' + encodeURIComponent(withCity) +
              '&limit=8&addressdetails=1&countrycodes=in' +
              '&viewbox=76.45,12.1,76.85,12.55&bounded=0';

    fetch(url, { headers: { 'Accept-Language': 'en' } })
    .then(function(r) { return r.json(); })
    .then(function(results) {
      /* if no results with city, try bare query */
      if (!results || !results.length) {
        return fetch('https://nominatim.openstreetmap.org/search?format=json' +
                     '&q=' + encodeURIComponent(q) +
                     '&limit=8&addressdetails=1&countrycodes=in',
                     { headers: { 'Accept-Language': 'en' } })
               .then(function(r) { return r.json(); });
      }
      return results;
    })
    .then(function(results) {
      box.innerHTML = '';
      if (!results || !results.length) {
        box.innerHTML = '<div class="addr-sug-empty">' +
          '📍 Address not found — drag the map pin to your exact location</div>';
        return;
      }
      box.classList.add('show');
      results.forEach(function(r) {
        var parts = r.display_name.split(',');
        var main  = esc(parts[0].trim());
        var sub   = esc(parts.slice(1, 4).join(',').trim());
        var item  = document.createElement('div');
        item.className  = 'addr-sug-item';
        item.tabIndex   = 0;
        item.innerHTML  = '<span class="addr-sug-icon">📍</span>' +
                          '<div><div class="addr-sug-main">' + main + '</div>' +
                          '<div class="addr-sug-sub">'  + sub  + '</div></div>';
        /* store all data on element */
        item.dataset.lat  = r.lat;
        item.dataset.lon  = r.lon;
        item.dataset.name = r.display_name;
        function pick() {
          var lat  = parseFloat(this.dataset.lat);
          var lng  = parseFloat(this.dataset.lon);
          var name = this.dataset.name;
          /* short 3-part name for display */
          var short = name.split(',').slice(0, 3).join(',').trim();
          /* fill search box with the same address from the suggestion */
          var si = document.getElementById('addr-search');
          if (si) { si.value = short; si.classList.remove('err'); }
          var se = document.getElementById('err-addr');
          if (se) se.classList.remove('on');
          /* close dropdown */
          box.innerHTML = ''; box.classList.remove('show');
          /* move pin + store address — no extra geocode needed */
          _movePinTo(lat, lng, short);
        }
        item.addEventListener('click',   pick);
        item.addEventListener('keydown', function(e) { if (e.key === 'Enter') pick.call(this); });
        box.appendChild(item);
      });
    })
    .catch(function() {
      box.innerHTML = '<div class="addr-sug-empty">Search unavailable — use map pin below</div>';
    });
  }, 400);
}

/* ════════════════════════════════════════════
   GPS DETECT BUTTON
   ════════════════════════════════════════════ */
function detectLocation() {
  if (detectLocation._busy) return;
  detectLocation._busy = true;
  setTimeout(function(){ detectLocation._busy = false; }, 4000);
  if (!navigator.geolocation) { toast('GPS not supported by your browser', 'err'); return; }

  var btn  = document.getElementById('loc-btn');
  var icon = document.getElementById('loc-btn-icon');
  var txt  = document.getElementById('loc-btn-txt');
  if (btn)  btn.disabled = true;
  if (icon) icon.style.display = 'none';
  if (txt)  txt.innerHTML = '<span class="spin" style="font-size:.85rem">⏳</span>';

  navigator.geolocation.getCurrentPosition(
    function(pos) {
      var lat = pos.coords.latitude, lng = pos.coords.longitude;
      /* move pin immediately */
      _locState.lat = lat; _locState.lng = lng; _locState.pinPlaced = true;
      if (_map && _marker) {
        _marker.setLatLng([lat, lng]);
        _map.setView([lat, lng], 18);
        _marker.openPopup();
      }
      _setDistBadge(_haversine(lat, lng, RESTAURANT.lat, RESTAURANT.lng));
      /* reverse geocode → fill fields + store pinAddr */
      _reverseGeocode(lat, lng, function(street, place) {
        _locState.pinAddr = street;           /* ← stored here */
        var si = document.getElementById('addr-search');
        if (si) si.value = street || (lat.toFixed(5) + ', ' + lng.toFixed(5));
        var bi = document.getElementById('cbuild');
        if (bi && place && !bi.value) bi.value = place;
        if (btn)  btn.disabled = false;
        if (icon) icon.style.display = '';
        if (txt)  txt.textContent = '';
        toast('✅ Location detected — edit if needed');
      });
    },
    function(err) {
      if (btn)  btn.disabled = false;
      if (icon) icon.style.display = '';
      if (txt)  txt.textContent = '';
      detectLocation._busy = false;
      var msgs = {
        1: 'Location permission denied. Allow location in browser settings.',
        2: 'Could not get GPS. Check that location is ON.',
        3: 'GPS timed out. Try again.'
      };
      toast(msgs[err.code] || 'Location unavailable.', 'err');
    },
    { timeout: 15000, maximumAge: 0, enableHighAccuracy: true }
  );
}

/* close dropdown on outside click */
document.addEventListener('click', function(e) {
  if (e.target && !e.target.closest('.addr-search-wrap')) {
    var box = document.getElementById('addr-suggestions');
    if (box) { box.innerHTML = ''; box.classList.remove('show'); }
  }
});

/* no-op kept for compatibility */
function onAddrInput() {}





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

  var build = document.getElementById('cbuild') ? document.getElementById('cbuild').value.trim() : '';
  var flat  = addr; /* caddr = flat/house number */

  /* Build ONE unified address:
     If pin was placed → use the reverse-geocoded address from the pin (pinAddr)
     so text and map link both point to the exact same location.
     If no pin → use whatever the customer typed. */
  var areaText = _locState.pinPlaced && _locState.pinAddr
                   ? _locState.pinAddr
                   : (document.getElementById('addr-search') ? document.getElementById('addr-search').value.trim() : '');

  var fullAddr    = [areaText, build, flat].filter(Boolean).join(', ');

  var addressLine = '';
  if (_locState.pinPlaced && _locState.lat !== null) {
    var dist   = _haversine(_locState.lat, _locState.lng, RESTAURANT.lat, RESTAURANT.lng);
    var navUrl = 'https://www.google.com/maps/dir/?api=1' +
                 '&destination=' + _locState.lat.toFixed(6) + ',' + _locState.lng.toFixed(6);
    /* fullAddr was built from pinAddr (reverse-geocode of these exact coords)
       so text, pin, and link all represent the same single location */
    addressLine = fullAddr +
                  '\n📏 Distance: ' + dist.toFixed(1) + ' km' +
                  '\n🗺️ Open in Maps: ' + navUrl;
  } else {
    /* No pin placed — customer typed manually, send text only */
    addressLine = fullAddr;
  }

  var msg = '🌿 *New Order — Aranya Garden*\n\n' +
            '📋 *Items:*\n' + items + '\n\n' +
            '💰 *Total: ₹' + cartTotal() + '*\n\n' +
            '👤 *Customer:*\n' +
            'Name: '    + name     + '\n' +
            'Phone: '   + phone    + '\n' +
            'Address: ' + addressLine + '\n\n' +
            '💳 Payment: Cash on Delivery\n' +
            '⏱ Kindly confirm. Thank you!';

  closeCart();
  window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
  cart = {}; saveCart(); updateBadge(); syncCards(); renderCart();
  toast('Order sent to WhatsApp! 🎉');
}
