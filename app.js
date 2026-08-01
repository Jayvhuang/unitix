/* Unitix — unit converter logic (data-driven, bilingual). */
(function(){
  var CONV = window.UNITIX_CONV || {};
  var I18N = window.UNITIX_I18N || {en:{},zh:{}};
  var lang = (function(){try{return localStorage.getItem('unitix_lang')||'en';}catch(e){return 'en';}})();
  var theme = (function(){try{return localStorage.getItem('unitix_theme')||'light';}catch(e){return 'light';}})();

  function $(s,r){return (r||document).querySelector(s);}
  function $all(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}

  function fmt(x){
    if(x===null||x===undefined||!isFinite(x)) return '—';
    if(x===0) return '0';
    var a=Math.abs(x);
    if(a>=1e15||a<1e-9) return x.toExponential(6);
    return parseFloat(x.toPrecision(12)).toString();
  }
  function tempToBase(u,v){ if(u==='celsius')return v; if(u==='fahrenheit')return (v-32)*5/9; if(u==='kelvin')return v-273.15; return v; }
  function tempFromBase(u,b){ if(u==='celsius')return b; if(u==='fahrenheit')return b*9/5+32; if(u==='kelvin')return b+273.15; return b; }
  function fuelToBase(u,v){ if(u==='l100')return v; if(u==='mpg_us')return 235.214583/v; if(u==='mpg_uk')return 282.480936/v; return v; }
  function fuelFromBase(u,b){ if(u==='l100')return b; if(u==='mpg_us')return 235.214583/b; if(u==='mpg_uk')return 282.480936/b; return b; }
  function findUnit(c,k){ for(var i=0;i<c.units.length;i++){ if(c.units[i].k===k) return c.units[i]; } return null; }
  function toBase(slug,u,v){
    var c=CONV[slug]; if(!c) return v;
    if(c.special==='temperature') return tempToBase(u,v);
    if(c.special==='fuel') return fuelToBase(u,v);
    var unit=findUnit(c,u); return v*(unit?unit.f:1);
  }
  function fromBase(slug,u,b){
    var c=CONV[slug]; if(!c) return b;
    if(c.special==='temperature') return tempFromBase(u,b);
    if(c.special==='fuel') return fuelFromBase(u,b);
    var unit=findUnit(c,u); return b/(unit?unit.f:1);
  }
  function convert(slug,from,to,v){ return fromBase(slug,to,toBase(slug,from,v)); }

  function fillTable(convEl,slug,from,raw){
    var c=CONV[slug]; if(!c) return;
    var toSel=$('.to',convEl); if(!toSel) return;
    var to=toSel.value;
    var tb=$('.ctable tbody',convEl); if(!tb) return;
    var rows='';
    for(var i=0;i<c.units.length;i++){
      var u=c.units[i];
      var val=convert(slug,from,u.k,raw);
      var hl=(u.k===to)?' class="hl"':'';
      rows+='<tr'+hl+'><td data-en="'+u.en+'" data-zh="'+u.zh+'">'+u.en+'</td><td>'+fmt(val)+'</td></tr>';
    }
    tb.innerHTML=rows;
    applyLangTo(tb);
  }
  function compute(convEl){
    var slug=convEl.getAttribute('data-conv'); if(!CONV[slug]) return;
    var fromSel=$('.from',convEl), toSel=$('.to',convEl), valEl=$('.val',convEl), resEl=$('.res',convEl);
    if(!fromSel||!toSel||!valEl||!resEl) return;
    var from=fromSel.value, to=toSel.value, raw=parseFloat(valEl.value);
    if(!isFinite(raw)){ resEl.textContent='—'; convEl.setAttribute('data-res','—'); fillTable(convEl,slug,from,NaN); return; }
    var res=convert(slug,from,to,raw);
    resEl.textContent=fmt(res);
    convEl.setAttribute('data-res',fmt(res));
    fillTable(convEl,slug,from,raw);
  }
  function computeAll(){ $all('.conv').forEach(compute); }

  function applyLangTo(root){
    $all('[data-i18n]',root).forEach(function(el){ var t=I18N[lang] && I18N[lang][el.getAttribute('data-i18n')]; if(t!==undefined) el.textContent=t; });
    $all('[data-en]',root).forEach(function(el){ el.textContent = (lang==='zh')? el.getAttribute('data-zh') : el.getAttribute('data-en'); });
  }
  function applyLang(){
    document.documentElement.setAttribute('lang', lang==='zh'?'zh-CN':'en');
    document.documentElement.setAttribute('data-theme', theme);
    $all('[data-i18n]').forEach(function(el){ var t=I18N[lang] && I18N[lang][el.getAttribute('data-i18n')]; if(t!==undefined) el.textContent=t; });
    $all('[data-en]').forEach(function(el){ el.textContent = (lang==='zh')? el.getAttribute('data-zh') : el.getAttribute('data-en'); });
    var btn=$('#lang-btn'); if(btn) btn.textContent = (lang==='zh')? 'EN' : '中文';
    try{ localStorage.setItem('unitix_lang',lang); localStorage.setItem('unitix_theme',theme); }catch(e){}
  }

  function wire(){
    // tabs
    var tabs=$('#tabs');
    if(tabs){
      tabs.addEventListener('click', function(e){
        var b=e.target.closest('.tab'); if(!b) return;
        var slug=b.getAttribute('data-tab');
        $all('.tab').forEach(function(t){ t.classList.toggle('active', t===b); });
        $all('.panel').forEach(function(p){ p.classList.toggle('active', p.id==='p-'+slug); });
      });
    }
    // converters
    $all('.conv').forEach(function(convEl){
      var slug=convEl.getAttribute('data-conv');
      var fromSel=$('.from',convEl), toSel=$('.to',convEl), valEl=$('.val',convEl);
      fromSel.addEventListener('change', function(){ compute(convEl); });
      toSel.addEventListener('change', function(){ compute(convEl); });
      valEl.addEventListener('input', function(){ compute(convEl); });
      var swap=$('.swap',convEl);
      if(swap) swap.addEventListener('click', function(){
        var a=fromSel.value; fromSel.value=toSel.value; toSel.value=a; compute(convEl);
      });
      var copy=$('.copy',convEl);
      if(copy) copy.addEventListener('click', function(){
        var txt=convEl.getAttribute('data-res')||'';
        var done=function(){ var o=copy.textContent; copy.textContent=I18N[lang].copied||'Copied!'; setTimeout(function(){ copy.textContent=o; },1200); };
        if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done,function(){}); }
        else { try{ var ta=document.createElement('textarea'); ta.value=txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); }catch(e){} }
      });
    });
    // theme + lang
    var tb=$('#theme-btn'); if(tb) tb.addEventListener('click', function(){ theme=(theme==='light')?'dark':'light'; applyLang(); });
    var lb=$('#lang-btn'); if(lb) lb.addEventListener('click', function(){ lang=(lang==='en')?'zh':'en'; applyLang(); computeAll(); });
    // hash scroll
    if(location.hash && location.hash.indexOf('#p-')===0){
      var slug=location.hash.slice(3);
      var tab=$('.tab[data-tab="'+slug+'"]'); if(tab) tab.click();
    } else {
      var first=$('.tab'); if(first) first.classList.add('active');
      var fp=$('.panel'); if(fp) fp.classList.add('active');
    }
  }

  function init(){
    applyLang();
    wire();
    computeAll();
  }
  if(document.readyState!=='loading') init();
  else document.addEventListener('DOMContentLoaded', init);

  window.__ux = {
    convert: convert, CONV: CONV,
    getLang: function(){ return lang; },
    setLang: function(l){ lang=l; applyLang(); computeAll(); }
  };
})();
