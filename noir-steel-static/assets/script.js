const m=document.querySelector('.menu-btn'),n=document.querySelector('nav');if(m)m.addEventListener('click',()=>n.classList.toggle('open'));document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>n.classList.remove('open')));const lb=document.querySelector('.lightbox');document.querySelectorAll('[data-large]').forEach(i=>i.addEventListener('click',()=>{lb.querySelector('img').src=i.dataset.large;lb.classList.add('open')}));if(lb){lb.querySelector('button').onclick=()=>lb.classList.remove('open');lb.onclick=e=>{if(e.target===lb)lb.classList.remove('open')}}(function(){
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


(function(){
 const form=document.getElementById('contact-form');
 if(!form)return;
 const status=document.getElementById('form-status');
 const button=form.querySelector('.form-submit');
 const value=id=>document.getElementById(id)?.value?.trim()||'';
 const setStatus=(text,type='')=>{if(!status)return;status.textContent=text;status.className='form-status'+(type?' '+type:'')};
 form.addEventListener('submit',async event=>{
   event.preventDefault();
   setStatus('');
   if(!form.checkValidity()){
     form.reportValidity();
     setStatus('Uzupełnij wymagane pola i zaznacz zgodę.','error');
     return;
   }
   const shape=document.querySelector('input[name="shape"]:checked')?.value||'Nie wybrano';
   const mechanism=document.querySelector('input[name="mechanism"]:checked')?.value||((value('type')==='Stół rozkładany')?'Nie wybrano':'Nie dotyczy');
   const payload={
     name:value('name'), phone:value('phone'), email:value('email'), size:value('size'),
     type:value('type'), mechanism, shape, city:value('city'), message:value('message'),
     website:value('website'), consent:document.getElementById('consent')?.checked===true,
     page:location.href
   };
   button.disabled=true;
   button.dataset.label=button.textContent;
   button.textContent='Wysyłanie…';
   setStatus('Wysyłamy Twoje zapytanie…');
   try{
     const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
     const result=await response.json().catch(()=>({}));
     if(!response.ok)throw new Error(result.error||'Nie udało się wysłać formularza.');
     sessionStorage.setItem('noirLeadSubmitted','1');
     location.href='/dziekujemy';
   }catch(error){
     setStatus(error.message||'Wystąpił błąd. Zadzwoń pod numer 508 951 101 lub napisz na kontakt@noirsteel.pl.','error');
     button.disabled=false;
     button.textContent=button.dataset.label||'Wyślij zapytanie';
   }
 });
})();
