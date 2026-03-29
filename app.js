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
  var flat  = document.getElementById('caddr').value.trim();

  function setErr(id, eid, show) {
    var el = document.getElementById(id), er = document.getElementById(eid);
    if (el) el.classList.toggle('err', show);
    if (er) er.classList.toggle('on', show);
    if (show) ok = false;
  }

  setErr('cname',  'err-name',  name.length < 2);
  setErr('cphone', 'err-phone', !/^[6-9]\d{9}$/.test(phone));

  /* location must be detected (pin placed on map) */
  var locErr = document.getElementById('err-addr');
  if (!_loc.placed) {
    if (locErr) { locErr.textContent = 'Please detect your location first.'; locErr.classList.add('on'); }
    ok = false;
  } else {
    if (locErr) locErr.classList.remove('on');
  }

  /* flat number must be filled */
  setErr('caddr', 'err-addr2', flat.length < 2);

  /* if pin placed AND outside range — block */
  if (_loc.checked && !_loc.inRange) {
    if (locErr) { locErr.textContent = 'Outside 5 km delivery range.'; locErr.classList.add('on'); }
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

/* _loc — single authoritative location state */
var _loc = { lat:null, lng:null, addr:'', placed:false, inRange:false, checked:false };
var _map=null, _marker=null, _sugTimer=null;

/* also keep _locState alias so validateForm/placeOrder still work */
var _locState = _loc;

function _haversine(la1,lo1,la2,lo2){
  var R=6371,r=Math.PI/180;
  var a=Math.sin((la2-la1)*r/2)*Math.sin((la2-la1)*r/2)+
        Math.cos(la1*r)*Math.cos(la2*r)*
        Math.sin((lo2-lo1)*r/2)*Math.sin((lo2-lo1)*r/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function _setDistBadge(km){
  var badge=document.getElementById('dist-badge');
  var noMsg=document.getElementById('no-delivery-msg');
  var btn=document.querySelector('.place-btn');
  if(!badge)return;
  if(km===null){
    badge.className='pending';
    badge.innerHTML='📍 Drag the pin to your location to check delivery';
    if(noMsg)noMsg.classList.remove('show');
    if(btn)btn.disabled=false;
    return;
  }
  var ok=km<=DELIVERY_RADIUS_KM;
  _loc.inRange=ok; _loc.checked=true;
  /* keep _locState fields in sync for validateForm */
  _loc.withinRange=ok;
  badge.className='show '+(ok?'ok':'far');
  badge.innerHTML=ok
    ?'✅ '+km.toFixed(1)+' km away — Delivery available 🛵'
    :'⚠️ '+km.toFixed(1)+' km away — Outside 5 km delivery range';
  if(noMsg)noMsg.classList.toggle('show',!ok);
  if(btn)btn.disabled=!ok;
}

function _revGeo(lat,lng,cb){
  fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat='
        +lat+'&lon='+lng+'&zoom=18&addressdetails=1',
        {headers:{'Accept-Language':'en'}})
  .then(function(r){return r.json();})
  .then(function(d){
    if(!d||!d.address){cb('','');return;}
    var a=d.address;
    var place=a.amenity||a.tourism||a.leisure||a.shop||a.fuel||
              a.office||a.building||a.healthcare||a.historic||'';
    var pts=[];
    if(a.house_number)pts.push(a.house_number);
    var st=a.road||a.pedestrian||a.path||a.footway||'';
    if(st)pts.push(st);
    var ar=a.quarter||a.neighbourhood||a.suburb||a.residential||'';
    if(ar)pts.push(ar);
    var ci=a.city||a.town||a.municipality||a.village||'';
    if(ci)pts.push(ci);
    if(a.state)pts.push(a.state);
    if(a.postcode)pts.push(a.postcode);
    cb(pts.filter(Boolean).join(', ')||d.display_name||'',place);
  })
  .catch(function(){cb('','');});
}

function _pinTo(lat,lng){
  _loc.lat=lat; _loc.lng=lng; _loc.placed=true;
  if(_map&&_marker){ _marker.setLatLng([lat,lng]); _map.setView([lat,lng],17); _marker.openPopup(); }
  _setDistBadge(_haversine(lat,lng,RESTAURANT.lat,RESTAURANT.lng));
}

function _fillFields(addr,place){
  _loc.addr=addr;
  /* show detected address in read-only display */
  var disp=document.getElementById('loc-addr-display');
  if(disp){
    disp.textContent=addr||'Location set on map';
    disp.classList.toggle('filled', !!addr);
  }
  /* clear location error */
  var se=document.getElementById('err-addr');
  if(se)se.classList.remove('on');
  /* fill building name only if field is currently empty */
  var bi=document.getElementById('cbuild');
  if(bi&&place&&!bi.value)bi.value=place;
}

function _initMap(){
  if(_map){setTimeout(function(){_map.invalidateSize();},80);return;}
  var el=document.getElementById('map-picker');
  if(!el||typeof L==='undefined')return;
  _map=L.map('map-picker',{zoomControl:true,attributionControl:false})
         .setView([RESTAURANT.lat,RESTAURANT.lng],14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(_map);
  L.marker([RESTAURANT.lat,RESTAURANT.lng],{
    icon:L.divIcon({html:'<div style="font-size:1.5rem">&#127978;</div>',className:'',iconAnchor:[12,24]}),
    title:'Aranya Garden'
  }).addTo(_map).bindPopup('<b>Aranya Garden</b><br>Saraswathipuram, Mysuru');
  _marker=L.marker([12.2958,76.6394],{
    icon:L.divIcon({html:'<div style="font-size:2rem;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))">&#128205;</div>',className:'',iconAnchor:[12,36]}),
    draggable:true,title:'Drag to your location'
  }).addTo(_map);
  _marker.bindPopup('<b>Your location</b><br><small>Drag to adjust</small>').openPopup();
  _marker.on('drag',function(){
    var ll=_marker.getLatLng();
    _loc.lat=ll.lat;_loc.lng=ll.lng;
    _setDistBadge(_haversine(ll.lat,ll.lng,RESTAURANT.lat,RESTAURANT.lng));
  });
  _marker.on('dragend',function(){
    var ll=_marker.getLatLng();
    _loc.lat=ll.lat;_loc.lng=ll.lng;_loc.placed=true;
    _setDistBadge(_haversine(ll.lat,ll.lng,RESTAURANT.lat,RESTAURANT.lng));
    _revGeo(ll.lat,ll.lng,_fillFields);
  });
  _map.on('click',function(e){
    var la=e.latlng.lat,lo=e.latlng.lng;
    _loc.lat=la;_loc.lng=lo;_loc.placed=true;
    _marker.setLatLng([la,lo]).openPopup();
    _setDistBadge(_haversine(la,lo,RESTAURANT.lat,RESTAURANT.lng));
    _revGeo(la,lo,_fillFields);
  });
  setTimeout(function(){_map.invalidateSize();},100);
  setTimeout(function(){_map.invalidateSize();},500);
}

function detectLocation(){
  if(detectLocation._busy)return;
  detectLocation._busy=true;
  setTimeout(function(){detectLocation._busy=false;},4000);
  if(!navigator.geolocation){toast('GPS not supported','err');return;}
  var btn=document.getElementById('loc-btn');
  var icon=document.getElementById('loc-btn-icon');
  var txt=document.getElementById('loc-btn-txt');
  if(btn)btn.disabled=true;
  if(icon)icon.style.display='none';
  if(txt)txt.innerHTML='<span class="spin" style="font-size:.85rem">&#9203;</span>';
  navigator.geolocation.getCurrentPosition(
    function(pos){
      var lat=pos.coords.latitude,lng=pos.coords.longitude;
      _loc.lat=lat;_loc.lng=lng;_loc.placed=true;
      if(_map&&_marker){_marker.setLatLng([lat,lng]);_map.setView([lat,lng],18);_marker.openPopup();}
      _setDistBadge(_haversine(lat,lng,RESTAURANT.lat,RESTAURANT.lng));
      _revGeo(lat,lng,function(addr,place){
        _fillFields(addr||lat.toFixed(5)+', '+lng.toFixed(5),place);
        if(btn)btn.disabled=false;
        if(icon)icon.style.display='';
        if(txt)txt.textContent='';
        toast('Location detected');
      });
    },
    function(err){
      if(btn)btn.disabled=false;if(icon)icon.style.display='';if(txt)txt.textContent='';
      detectLocation._busy=false;
      var m={1:'Location denied. Allow in browser settings.',2:'GPS unavailable.',3:'GPS timed out.'};
      toast(m[err.code]||'Location unavailable.','err');
    },
    {timeout:15000,maximumAge:0,enableHighAccuracy:true}
  );
}

function onAddrSearch(val){
  var box=document.getElementById('addr-suggestions');
  if(!box)return;
  clearTimeout(_sugTimer);
  var q=val.trim();
  if(q.length<3){box.innerHTML='';box.classList.remove('show');return;}
  box.innerHTML='<div class="addr-sug-loading">Searching...</div>';
  box.classList.add('show');
  _sugTimer=setTimeout(function(){
    var query=(/mysuru|mysore|karnataka/i.test(q))?q:q+', Mysuru Karnataka';
    fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(query)+'&limit=8&addressdetails=1&countrycodes=in&viewbox=76.45,12.1,76.85,12.55&bounded=0',{headers:{'Accept-Language':'en'}})
    .then(function(r){return r.json();})
    .then(function(res){
      if(!res||!res.length){
        return fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(q)+'&limit=8&addressdetails=1&countrycodes=in',{headers:{'Accept-Language':'en'}}).then(function(r){return r.json();});
      }
      return res;
    })
    .then(function(res){
      box.innerHTML='';
      if(!res||!res.length){
        box.innerHTML='<div class="addr-sug-empty">Not found — drag the map pin instead</div>';
        return;
      }
      box.classList.add('show');
      res.forEach(function(r){
        var parts=r.display_name.split(',');
        var main=esc(parts[0].trim());
        var sub=esc(parts.slice(1,4).join(',').trim());
        var item=document.createElement('div');
        item.className='addr-sug-item';item.tabIndex=0;
        item.innerHTML='<span class="addr-sug-icon">&#128205;</span><div><div class="addr-sug-main">'+main+'</div><div class="addr-sug-sub">'+sub+'</div></div>';
        item.dataset.lat=r.lat;item.dataset.lon=r.lon;
        item.dataset.addr=parts.slice(0,4).join(',').trim();
        item.addEventListener('click',_onSugPick);
        item.addEventListener('keydown',function(ev){if(ev.key==='Enter')_onSugPick.call(this);});
        box.appendChild(item);
      });
    })
    .catch(function(){box.innerHTML='<div class="addr-sug-empty">Search unavailable</div>';});
  },400);
}

function _onSugPick(){
  var lat=parseFloat(this.dataset.lat);
  var lng=parseFloat(this.dataset.lon);
  var addr=this.dataset.addr||'';
  var box=document.getElementById('addr-suggestions');
  if(box){box.innerHTML='';box.classList.remove('show');}
  _pinTo(lat,lng);
  _fillFields(addr,'');
}

/* onAddrInput and onAddrSearch kept as no-ops for compatibility */
function onAddrSearch(){}
function onAddrInput(){}





/* ── PLACE ORDER ── */
function placeOrder() {
  if (!validateForm()) return;
  if (_loc.checked && !_loc.inRange) {
    toast('Outside delivery range. We cannot deliver here.', 'err');
    return;
  }

  var name  = document.getElementById('cname').value.trim();
  var phone = document.getElementById('cphone').value.trim();
  var flat  = document.getElementById('caddr').value.trim();
  var build = (document.getElementById('cbuild') || {value:''}).value.trim();

  var items = Object.entries(cart).map(function(e) {
    return '\u2022 ' + e[0] + ' x ' + e[1].q + ' \u2014 \u20b9' + (e[1].p * e[1].q);
  }).join('\n');

  /* address = detected area + building + flat — all one line */
  var fullAddr = [_loc.addr, build, flat].filter(Boolean).join(', ');

  /* Google Maps pin link — restaurant taps, sees exact customer location */
  var locLine = '';
  if (_loc.lat !== null) {
    var dist    = _haversine(_loc.lat, _loc.lng, RESTAURANT.lat, RESTAURANT.lng);
    var mapLink = 'https://maps.google.com/?q=' + _loc.lat.toFixed(6) + ',' + _loc.lng.toFixed(6);
    locLine = '\n\ud83d\udccd Distance: ' + dist.toFixed(1) + ' km'
            + '\n\ud83d\uddfa\ufe0f Location: ' + mapLink;
  }

  var msg = '\ud83c\udf3f *New Order \u2014 Aranya Garden*\n\n'
          + '\ud83d\udccb *Items:*\n' + items + '\n\n'
          + '\ud83d\udcb0 *Total: \u20b9' + cartTotal() + '*\n\n'
          + '\ud83d\udc64 *Customer:*\n'
          + 'Name: '    + name     + '\n'
          + 'Phone: '   + phone    + '\n'
          + 'Address: ' + fullAddr + locLine + '\n\n'
          + '\ud83d\udcb3 Payment: Cash on Delivery\n'
          + '\u23f1 Kindly confirm. Thank you!';

  closeCart();
  window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
  cart = {}; saveCart(); updateBadge(); syncCards(); renderCart();
  toast('Order sent to WhatsApp! \ud83c\udf89');
}
document.addEventListener('DOMContentLoaded', function() {
  try { loadCart(); } catch(e) { console.warn('loadCart', e); cart = {}; }
  try { renderMenus(); } catch(e) { console.error('renderMenus', e); }
  try { updateStatus(); setInterval(updateStatus, 60000); } catch(e) {}
  try { initStickyNav(); } catch(e) {}
  try { initMobNav(); } catch(e) {}
  try { updateBadge(); } catch(e) {}
  try { initFadeIn(); setTimeout(initFadeIn, 600); } catch(e) {}

  /* WhatsApp nav buttons */
  try {
    ['nav-wa','hero-wa','mob-wa','apps-wa'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el && id !== 'mob-wa') {
        el.addEventListener('click', function(e) { e.preventDefault(); waOpen(); });
      }
    });
  } catch(e) {}

  /* Swiggy placeholder */
  try {
    var sw = document.getElementById('swiggy-btn');
    if (sw) sw.addEventListener('click', function() { toast('Coming soon on Swiggy!'); });
  } catch(e) {}

  /* Scroll to top */
  try {
    var topBtn = document.getElementById('go-top');
    if (topBtn) {
      window.addEventListener('scroll', function() {
        topBtn.classList.toggle('show', window.scrollY > 320);
      }, { passive: true });
      topBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  } catch(e) {}
});
