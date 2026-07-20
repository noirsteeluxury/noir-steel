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
 const label=button?.querySelector('.submit-label');
 const started=document.getElementById('started_at');
 const request=document.getElementById('request_id');
 const draftKey='noirContactDraft';
 const value=id=>document.getElementById(id)?.value?.trim()||'';
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const uuid=()=>crypto.randomUUID?crypto.randomUUID().replaceAll('-',''):(Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2));
 const setStatus=(text,type='')=>{if(!status)return;status.textContent=text;status.className='form-status'+(type?' '+type:'');if(text)status.focus?.()};
 const setLoading=loading=>{if(!button)return;button.disabled=loading;button.classList.toggle('is-loading',loading);button.setAttribute('aria-busy',String(loading));if(label)label.textContent=loading?'Wysyłanie…':'Wyślij zapytanie'};
 const clearErrors=()=>{form.querySelectorAll('[aria-invalid="true"]').forEach(el=>el.removeAttribute('aria-invalid'));form.querySelectorAll('.field-error').forEach(el=>el.remove())};
 const showFieldError=(field,message)=>{field.setAttribute('aria-invalid','true');const error=document.createElement('p');error.className='field-error';error.textContent=message;field.closest('label')?.after(error)};
 const saveDraft=()=>{const data={name:value('name'),phone:value('phone'),email:value('email'),size:value('size'),type:value('type'),city:value('city'),message:value('message')};sessionStorage.setItem(draftKey,JSON.stringify(data))};
 const restoreDraft=()=>{try{const data=JSON.parse(sessionStorage.getItem(draftKey)||'{}');Object.entries(data).forEach(([key,val])=>{const el=document.getElementById(key);if(el&&!el.value)el.value=val})}catch{sessionStorage.removeItem(draftKey)}};
 if(started)started.value=String(Date.now());
 if(request)request.value=uuid();
 restoreDraft();
 form.addEventListener('input',saveDraft);
 form.addEventListener('change',saveDraft);
 form.addEventListener('submit',async event=>{
   event.preventDefault();
   clearErrors();
   setStatus('');
   const phone=document.getElementById('phone');
   const email=document.getElementById('email');
   if(phone&&phone.value.replace(/\D/g,'').length<7)showFieldError(phone,'Podaj poprawny numer telefonu.');
   if(email&&!email.validity.valid)showFieldError(email,'Podaj poprawny adres e-mail.');
   if(!form.checkValidity()||form.querySelector('[aria-invalid="true"]')){
     form.reportValidity();
     setStatus('Uzupełnij wymagane pola i zaznacz zgodę.','error');
     form.querySelector(':invalid,[aria-invalid="true"]')?.focus();
     return;
   }
   const shape=document.querySelector('input[name="shape"]:checked')?.value||'Nie wybrano';
   const mechanism=document.querySelector('input[name="mechanism"]:checked')?.value||((value('type')==='Stół rozkładany')?'Nie wybrano':'Nie dotyczy');
   const payload={
     name:value('name'),phone:value('phone'),email:value('email'),size:value('size'),
     type:value('type'),mechanism,shape,city:value('city'),message:value('message'),
     website:value('website'),started_at:value('started_at'),request_id:value('request_id'),
     consent:document.getElementById('consent')?.checked===true,page:location.href
   };
   setLoading(true);
   setStatus('Bezpiecznie wysyłamy Twoje zapytanie…');
   try{
     let response,result;
     for(let attempt=0;attempt<2;attempt+=1){
       try{
         response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
         result=await response.json().catch(()=>({}));
         if(response.ok)break;
         if(attempt===0&&(response.status===429||response.status>=500)){await wait(900);continue}
         throw new Error(result.error||'Nie udało się wysłać formularza.');
       }catch(error){
         if(attempt===0&&!response){await wait(900);continue}
         throw error;
       }
     }
     if(!response?.ok)throw new Error(result?.error||'Nie udało się wysłać formularza.');
     sessionStorage.removeItem(draftKey);
     sessionStorage.setItem('noirLeadSubmitted','1');
     setStatus('Wiadomość została wysłana. Za chwilę zobaczysz potwierdzenie.','success');
     await wait(350);
     location.href='/dziekujemy';
   }catch(error){
     setStatus(error.message||'Wystąpił błąd. Zadzwoń pod numer 508 951 101 lub napisz na kontakt@noirsteel.pl.','error');
     setLoading(false);
   }
 });
})();


(function(){
 const root=document.getElementById('crm-portfolio');
 const grid=document.getElementById('crm-portfolio-grid');
 if(!root||!grid)return;
 const escapeHtml=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 fetch('/api/portfolio')
  .then(response=>response.ok?response.json():Promise.reject(new Error('Błąd portfolio')))
  .then(({items=[]})=>{
    if(!items.length)return;
    grid.innerHTML=items.map(item=>{
      const photos=item.photos||[];
      const galleryClass=photos.length===2?'model-gallery two':'model-gallery';
      return `<article class="collection-item crm-portfolio-item"><div class="collection-head"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description||'Realizacja na indywidualne zamówienie')}</p></div><div class="${galleryClass}">${photos.map(photo=>`<img loading="lazy" data-large="${escapeHtml(photo.url)}" src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.alt)}">`).join('')}</div></article>`;
    }).join('');
    root.hidden=false;
    grid.querySelectorAll('[data-large]').forEach(image=>image.addEventListener('click',()=>{
      if(!lb)return;lb.querySelector('img').src=image.dataset.large;lb.classList.add('open');
    }));
  })
  .catch(error=>console.warn('Nie udało się załadować nowych realizacji:',error));
})();
