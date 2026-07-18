const m=document.querySelector('.menu-btn'),n=document.querySelector('nav');if(m)m.addEventListener('click',()=>n.classList.toggle('open'));document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>n.classList.remove('open')));const lb=document.querySelector('.lightbox');document.querySelectorAll('[data-large]').forEach(i=>i.addEventListener('click',()=>{lb.querySelector('img').src=i.dataset.large;lb.classList.add('open')}));if(lb){lb.querySelector('button').onclick=()=>lb.classList.remove('open');lb.onclick=e=>{if(e.target===lb)lb.classList.remove('open')}}function sendMail(e){e.preventDefault();const v=id=>document.getElementById(id)?.value||'';const shape=document.querySelector('input[name=shape]:checked')?.value||'Nie wybrano';const body=`Imię: ${v('name')}
Telefon: ${v('phone')}
E-mail: ${v('email')}
Wymiar: ${v('size')}
Rodzaj: ${v('type')}
Kształt blatu: ${shape}
Miasto: ${v('city')}

Wiadomość:
${v('message')}`;location.href=`mailto:noirsteel.luxury@gmail.com?subject=${encodeURIComponent('Zapytanie o stół Noir Steel')}&body=${encodeURIComponent(body)}`;return false}