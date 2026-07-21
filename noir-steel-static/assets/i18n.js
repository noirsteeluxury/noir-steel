
(function(){
 const lang=document.documentElement.lang||'pl';
 if(lang==='pl')return;
 const dict={en:{sending:'Sending…',send:'Send enquiry',phone:'Please enter a valid phone number.',email:'Please enter a valid email address.',required:'Complete the required fields and accept the consent.',safe:'Sending your enquiry securely…',failed:'The form could not be sent.',success:'Message sent. You will see a confirmation shortly.',fallback:'An error occurred. Call +48 508 951 101 or email kontakt@noirsteel.pl.'},de:{sending:'Wird gesendet…',send:'Anfrage senden',phone:'Bitte geben Sie eine gültige Telefonnummer ein.',email:'Bitte geben Sie eine gültige E-Mail-Adresse ein.',required:'Bitte füllen Sie die Pflichtfelder aus und stimmen Sie der Kontaktaufnahme zu.',safe:'Ihre Anfrage wird sicher gesendet…',failed:'Das Formular konnte nicht gesendet werden.',success:'Nachricht gesendet. Die Bestätigung wird gleich angezeigt.',fallback:'Ein Fehler ist aufgetreten. Rufen Sie +48 508 951 101 an oder schreiben Sie an kontakt@noirsteel.pl.'}}[lang];
 const form=document.getElementById('contact-form');if(!form||!dict)return;
 form.dataset.confirmPath='/'+lang+'/dziekujemy';
})();
