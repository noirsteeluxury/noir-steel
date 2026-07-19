const m=document.querySelector('.menu-btn'),n=document.querySelector('nav');if(m)m.addEventListener('click',()=>n.classList.toggle('open'));document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>n.classList.remove('open')));const lb=document.querySelector('.lightbox');document.querySelectorAll('[data-large]').forEach(i=>i.addEventListener('click',()=>{lb.querySelector('img').src=i.dataset.large;lb.classList.add('open')}));if(lb){lb.querySelector('button').onclick=()=>lb.classList.remove('open');lb.onclick=e=>{if(e.target===lb)lb.classList.remove('open')}}function sendMail(e){e.preventDefault();const v=id=>document.getElementById(id)?.value||'';const shape=document.querySelector('input[name=shape]:checked')?.value||'Nie wybrano';const mechanism=document.querySelector('input[name=mechanism]:checked')?.value||((v('type')==='Stół rozkładany')?'Nie wybrano':'Nie dotyczy');const body=`Imię: ${v('name')}
Telefon: ${v('phone')}
E-mail: ${v('email')}
Wymiar: ${v('size')}
Rodzaj: ${v('type')}
Sposób rozkładania: ${mechanism}
Kształt blatu: ${shape}
Miasto: ${v('city')}

Wiadomość:
${v('message')}`;location.href=`mailto:noirsteel.luxury@gmail.com?subject=${encodeURIComponent('Zapytanie o stół Noir Steel')}&body=${encodeURIComponent(body)}`;return false}
(function(){
 const type=document.getElementById('type');
 const section=document.getElementById('mechanism-section');
 const update=()=>{if(!type||!section)return;const show=type.value==='Stół rozkładany';section.hidden=!show;if(!show){document.querySelectorAll('input[name=mechanism]').forEach(i=>i.checked=false)}};
 if(type){type.addEventListener('change',update);update()}
 document.querySelectorAll('.mechanism-preview,.mechanism-image-button').forEach(b=>b.addEventListener('click',e=>{
   e.preventDefault();e.stopPropagation();
   if(lb){lb.querySelector('img').src=b.dataset.large;lb.classList.add('open')}
 }));
 const params=new URLSearchParams(location.search);
 const pre=params.get('mechanizm');
 if(pre&&type&&section){
   type.value='Stół rozkładany';update();
   const value=pre==='centralny'?'Dostawka centralna':pre==='boczny'?'Dostawki boczne':'';
   const input=[...document.querySelectorAll('input[name=mechanism]')].find(i=>i.value===value);
   if(input){input.checked=true;section.scrollIntoView({behavior:'smooth',block:'center'})}
 }
})();
