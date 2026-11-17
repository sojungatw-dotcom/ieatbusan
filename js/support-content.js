/* Published support content is loaded with the public bootstrap response. */
(function(){
  'use strict';
  const localize=(row,language)=>row?.translations?.[language]||row?.translations?.ko||{};
  window.IEBSupport={
    localize,
    text(data,language,key,fallback){return localize(data?.settings,language)[key]??fallback;},
    email:data=>data?.settings?.contact_email??'help@ieatbusan.example',
    validEmail:email=>typeof email==='string'&&/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(email)&&!email.endsWith('.example'),
  };
})();
