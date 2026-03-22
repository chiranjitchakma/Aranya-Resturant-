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
  document.body.style.overflow='hidden'; // prevent background scroll
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
  var ok=true;
  var name=document.getElementById('cname').value.trim();
  var phone=document.getElementById('cphone').value.trim();
  var addr=document.getElementById('caddr').value.trim();
  function setErr(id,eid,show){
    var el=document.getElementById(id),er=document.getElementById(eid);
    if(el)el.classList.toggle('err',show);
    if(er)er.classList.toggle('on',show);
    if(show)ok=false;
  }
  setErr('cname','err-name',name.length<2);
  setErr('cphone','err-phone',!/^[6-9]\d{9}$/.test(phone));
  setErr('caddr','err-addr',addr.length<5);
  // If GPS-verified and outside range, mark address field
  if(_locState.checked && !_locState.withinRange){
    setErr('caddr','err-addr',true);
    var errEl=document.getElementById('err-addr');
    if(errEl){errEl.textContent='Outside 5 km delivery range.';errEl.classList.add('on');}
    ok=false;
  }
  return ok;
}


// ── WHATSAPP ──
function waOpen(){window.open('https://wa.me/'+WA+'?text='+encodeURIComponent("Hello Aranya Garden! I'd like to place an order."),'_blank','noopener,noreferrer');}
function sendWA(){
  var msg=document.getElementById('ct-msg').value.trim();
  var name=document.getElementById('ct-name').value.trim();
  if(!msg){toast('Please type a message','err');return;}
  window.open('https://wa.me/'+WA+'?text='+encodeURIComponent('Hi Aranya Garden, '+msg+(name?' – '+name:'')),'_blank','noopener,noreferrer');
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
var RESTAURANT = { lat: 12.3053, lng: 76.6551 }; // Saraswathipuram, Mysuru
var DELIVERY_RADIUS_KM = 5;
var _locState = { lat: null, lng: null, checked: false, withinRange: false };

// Haversine distance in km
function _haversine(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function _setDistBadge(distKm) {
  var badge = document.getElementById('dist-badge');
  var noDelMsg = document.getElementById('no-delivery-msg');
  var placeBtn = document.querySelector('.place-btn');
  if (!badge) return;

  if (distKm === null) {
    badge.className = ''; // strip show/ok/far to hide
    if (noDelMsg) noDelMsg.classList.remove('show');
    return;
  }

  var within = distKm <= DELIVERY_RADIUS_KM;
  _locState.withinRange = within;
  _locState.checked = true;

  badge.classList.add('show');
  badge.classList.toggle('ok', within);
  badge.classList.toggle('far', !within);
  badge.innerHTML = within
    ? '✅ ' + distKm.toFixed(1) + ' km away — Delivery available'
    : '⚠️ ' + distKm.toFixed(1) + ' km away — Outside 5 km range';

  if (noDelMsg) noDelMsg.classList.toggle('show', !within);
  if (placeBtn) placeBtn.disabled = !within;
}

function detectLocation() {
  // Rate-limit: block re-click for 3 seconds
  if (detectLocation._busy) return;
  detectLocation._busy = true;
  setTimeout(function(){ detectLocation._busy = false; }, 3000);

  if (!navigator.geolocation) {
    toast('Geolocation not supported by your browser', 'err');
    return;
  }

  var btn = document.getElementById('loc-btn');
  var txt = document.getElementById('loc-btn-txt');
  if (btn) btn.disabled = true;
  if (txt) txt.innerHTML = '<span class="spin">⏳</span>';

  navigator.geolocation.getCurrentPosition(
    function(pos) {
      var lat = pos.coords.latitude;
      var lng = pos.coords.longitude;
      _locState.lat = lat;
      _locState.lng = lng;

      // Calculate distance immediately
      var dist = _haversine(lat, lng, RESTAURANT.lat, RESTAURANT.lng);
      _setDistBadge(dist);

      // Reverse geocode for human-readable address
      _reverseGeocode(lat, lng, function(addr) {
        var addrEl = document.getElementById('caddr');
        if (addrEl) {
          addrEl.value = addr;
          addrEl.focus();
          // Clear error if it was showing
          addrEl.classList.remove('err');
          var errEl = document.getElementById('err-addr');
          if (errEl) errEl.classList.remove('on');
        }
        if (btn) btn.disabled = false;
        if (txt) txt.textContent = 'Detect';
        toast('📍 Location detected — edit if needed');
      });
    },
    function(err) {
      if (btn) btn.disabled = false;
      if (txt) txt.textContent = 'Detect';
      var msgs = {
        1: 'Location access denied. Please allow location and retry.',
        2: 'Could not get your location. Check GPS/network.',
        3: 'Location request timed out. Try again.'
      };
      toast(msgs[err.code] || 'Location unavailable.', 'err');
    },
    { timeout: 12000, maximumAge: 30000, enableHighAccuracy: true }
  );
}

function _reverseGeocode(lat, lng, cb) {
  // Use Nominatim (OpenStreetMap) — free, no API key
  var url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' +
            encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lng) +
            '&zoom=18&addressdetails=1';

  fetch(url, {
    headers: { 'Accept-Language': 'en' }
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (!data || !data.address) { cb(lat.toFixed(5) + ', ' + lng.toFixed(5)); return; }
    var a = data.address;
    // Build a clean, readable address
    // Build address — covers all Nominatim field names used in India
    var parts = [];
    // Landmark / building name
    var landmark = a.amenity || a.shop || a.building || a.tourism || '';
    if (landmark) parts.push(landmark);
    // House / plot number
    if (a.house_number) parts.push(a.house_number);
    // Street
    var street = a.road || a.pedestrian || a.path || a.footway || '';
    if (street) parts.push(street);
    // Locality / area
    var area = a.quarter || a.neighbourhood || a.suburb || a.residential || '';
    if (area) parts.push(area);
    // City
    var city = a.city || a.town || a.municipality || a.county || a.state_district || a.village || '';
    if (city) parts.push(city);
    // State + PIN
    if (a.state) parts.push(a.state);
    if (a.postcode) parts.push(a.postcode);

    var addr = parts.filter(Boolean).join(', ');
    // display_name is always populated — use it as last resort
    cb(addr || data.display_name.split(',').slice(0,5).join(',').trim() || (lat.toFixed(5) + ', ' + lng.toFixed(5)));
  })
  .catch(function() {
    // Fallback: just use coordinates as text
    cb(lat.toFixed(5) + ', ' + lng.toFixed(5));
  });
}

// When user manually edits address, re-check if they had a GPS fix
function onAddrInput() {
  // If user edits, clear the distance check (we don't know new location)
  // Only clear if they meaningfully change it
  _locState.checked = false;
  _locState.withinRange = false;
  var badge = document.getElementById('dist-badge');
  if (badge) badge.classList.remove('show', 'ok', 'far');
  var noDelMsg = document.getElementById('no-delivery-msg');
  if (noDelMsg) noDelMsg.classList.remove('show');
  var placeBtn = document.querySelector('.place-btn');
  if (placeBtn) placeBtn.disabled = false; // Re-enable so they can still order
}

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

  var distLine = (_locState.checked && _locState.lat !== null)
    ? '\nDistance: ' + _haversine(_locState.lat, _locState.lng, RESTAURANT.lat, RESTAURANT.lng).toFixed(1) + ' km'
    : '';

  var msg = '🌿 *New Order — Aranya Garden*\n\n' +
            '📋 *Items:*\n' + items + '\n\n' +
            '💰 *Total: ₹' + cartTotal() + '*\n\n' +
            '👤 *Customer:*\n' +
            'Name: '    + name  + '\n' +
            'Phone: '   + phone + '\n' +
            'Address: ' + addr  + distLine + '\n\n' +
            '💳 Payment: Cash on Delivery\n' +
            '⏱ Kindly confirm. Thank you!';

  closeCart();
  window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
  cart = {}; saveCart(); updateBadge(); syncCards(); renderCart();
  toast('Order sent to WhatsApp! 🎉');
}
