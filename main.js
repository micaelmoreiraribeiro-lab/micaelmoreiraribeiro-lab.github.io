/* Interações discretas: progresso de leitura, comparador antes/depois, trailer de stories, gráficos. */
(function(){
  var reduce=false;
  try{reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}

  // barra de progresso (páginas de case)
  var prog=document.querySelector('.progress');
  if(prog){
    var tick=false;
    var upd=function(){
      var h=document.documentElement;var max=h.scrollHeight-h.clientHeight;
      prog.style.setProperty('--p',max>0?Math.min(1,h.scrollTop/max):0);tick=false;
    };
    window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});
    upd();
  }

  // comparador antes/depois (input range acessível por teclado)
  document.querySelectorAll('.compare').forEach(function(c){
    var r=c.querySelector('input[type=range]');
    var set=function(){c.style.setProperty('--pos',r.value+'%')};
    r.addEventListener('input',set);set();
  });

  // trailer: rolagem com botões
  document.querySelectorAll('.trailer').forEach(function(t){
    var reel=t.querySelector('.reel'),prev=t.querySelector('[data-dir="-1"]'),next=t.querySelector('[data-dir="1"]');
    if(!reel||!prev||!next)return;
    var step=function(d){var f=reel.querySelector('figure');var w=f?f.getBoundingClientRect().width+20:300;reel.scrollBy({left:d*w*2,behavior:reduce?'auto':'smooth'})};
    prev.addEventListener('click',function(){step(-1)});
    next.addEventListener('click',function(){step(1)});
    var state=function(){prev.disabled=reel.scrollLeft<8;next.disabled=reel.scrollLeft+reel.clientWidth>=reel.scrollWidth-8};
    reel.addEventListener('scroll',state,{passive:true});window.addEventListener('resize',state);state();
  });

  // gráficos: barras crescem ao entrar na tela
  var charts=document.querySelectorAll('.charts');
  if(charts.length&&'IntersectionObserver' in window&&!reduce){
    charts.forEach(function(c){c.classList.add('pre')});
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.remove('pre');io.unobserve(e.target)}})},{threshold:.25});
    charts.forEach(function(c){io.observe(c)});
  }
})();

/* copiar contato */
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('.copy'); if(!b) return;
  var t=b.getAttribute('data-copy'), old=b.textContent;
  var done=function(){b.textContent='✓'; setTimeout(function(){b.textContent=old},1400)};
  try{ navigator.clipboard.writeText(t).then(done,function(){sel(b)}) }catch(x){ sel(b) }
  function sel(btn){ try{var a=btn.parentNode.querySelector('.v');var r=document.createRange();r.selectNodeContents(a);var s=getSelection();s.removeAllRanges();s.addRange(r)}catch(_){} }
});

/* abas e capa */
(function(){
  var tabs=[].slice.call(document.querySelectorAll('.tabs [role=tab]')); if(!tabs.length) return;
  var sec=document.getElementById('explorar');
  function show(t,focus){
    tabs.forEach(function(b){var on=b===t;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;
      var p=document.getElementById(b.getAttribute('aria-controls')); if(p) p.hidden=!on;});
    if(focus) t.focus();
  }
  function go(name,scroll){
    var t=document.getElementById('t-'+name); if(!t) return; show(t);
    try{history.replaceState(null,'','#'+name)}catch(e){}
    if(scroll!==false&&sec){var r=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      var y=sec.getBoundingClientRect().top+window.pageYOffset-60; window.scrollTo({top:y,behavior:r?'auto':'smooth'})}
  }
  tabs.forEach(function(b,i){
    b.addEventListener('click',function(){show(b)});
    b.addEventListener('keydown',function(e){var k=e.key,n=null;
      if(k==='ArrowRight')n=tabs[(i+1)%tabs.length]; else if(k==='ArrowLeft')n=tabs[(i+tabs.length-1)%tabs.length];
      if(n){e.preventDefault();show(n,true)}});
  });
  document.addEventListener('click',function(e){
    var g=e.target.closest&&e.target.closest('[data-go]'); if(g){e.preventDefault();go(g.getAttribute('data-go'));return}
    var a=e.target.closest&&e.target.closest('a[href="#cases"],a[href="#sobre"]');
    if(a){e.preventDefault();go(a.getAttribute('href')==='#cases'?'cases':'about')}
  });
  var h=(location.hash||'');
  if(h==='#cases'||h==='#sobre'||h==='#about') setTimeout(function(){go(h==='#cases'?'cases':'about')},60);
})();

/* animações: entrada ao rolar + transição entre páginas */
(function(){
  var rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(rm||!('IntersectionObserver' in window)) return;
  var sel='.head,.about-grid,.how,.feature,.fig,figure,.cols3>div,.ficha>div,.prose,.reach li,h2.h2,.cmp,.carousel,.snap';
  var els=[].slice.call(document.querySelectorAll('main '+sel+',footer .say,footer .row'));
  els=els.filter(function(e){return !e.closest('.rv')||e.classList.contains('rv')});
  document.documentElement.classList.add('js-reveal');
  var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.08,rootMargin:'0px 0px -6% 0px'});
  els.forEach(function(e,i){e.classList.add('rv');e.style.setProperty('--d',((i%3)*0.08)+'s');io.observe(e)});
  // abas: revela os itens do painel recém-aberto
  document.addEventListener('click',function(){setTimeout(function(){document.querySelectorAll('.panel:not([hidden]) .rv').forEach(function(e){e.classList.add('in')})},30)});
  document.querySelectorAll('a[href$=".html"]').forEach(function(a){a.addEventListener('click',function(e){
    if(e.metaKey||e.ctrlKey||a.target==='_blank') return; e.preventDefault(); document.body.classList.add('leaving'); setTimeout(function(){location.href=a.href},230)})});
})();

/* inclinação 3D suave ao passar o mouse (capas e foto) */
(function(){
  if(!window.matchMedia||window.matchMedia('(prefers-reduced-motion:reduce)').matches||!window.matchMedia('(hover:hover)').matches) return;
  function bind(el,max,inner){
    el.addEventListener('pointermove',function(e){
      var r=el.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;
      el.style.transform='perspective(900px) rotateY('+(px*max)+'deg) rotateX('+(-py*max)+'deg) translateY(-6px)';
      if(inner){inner.style.transform='scale(1.07) translate('+(-px*14)+'px,'+(-py*10)+'px)'}
    });
    el.addEventListener('pointerleave',function(){el.style.transform='';if(inner)inner.style.transform=''});
  }
  document.querySelectorAll('.feature .poster').forEach(function(p){bind(p,7,p.querySelector('.pcover'))});
  document.querySelectorAll('.portrait2').forEach(function(p){bind(p,6,p.querySelector('img'))});
})();

/* luz que segue o mouse nas capas dos cases */
(function(){
  document.querySelectorAll('.feature .poster').forEach(function(p){
    p.addEventListener('mousemove',function(e){
      var r=p.getBoundingClientRect();
      p.style.setProperty('--mx',(e.clientX-r.left)+'px');
      p.style.setProperty('--my',(e.clientY-r.top)+'px');
    });
  });
})();

/* número do resultado sobe de 0 até o valor, uma vez */
(function(){
  var el=document.querySelector('.cnt[data-to]'); if(!el) return;
  var to=+el.getAttribute('data-to');
  if(matchMedia('(prefers-reduced-motion:reduce)').matches||!('IntersectionObserver' in window)) return;
  var done=false;
  new IntersectionObserver(function(es,ob){es.forEach(function(e){
    if(!e.isIntersecting||done) return; done=true; ob.disconnect();
    var t0=performance.now(),d=1100;
    (function step(t){var k=Math.min(1,(t-t0)/d);el.textContent=Math.round(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step)})(t0);
  })},{threshold:.6}).observe(el);
})();
