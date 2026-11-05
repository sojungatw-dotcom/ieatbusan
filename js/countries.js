/* Shared ISO 3166-1 alpha-2 allowlist. Labels follow UI language; stored codes do not. */
(function () {
  'use strict';
  const codes = Object.freeze(('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' '));
  const allowed = new Set(codes), labels = new Map();
  const isValid = code => typeof code === 'string' && allowed.has(code);
  const normalize = code => isValid(code) ? code : 'KR';
  function display(lang) {
    const locale = ['ko','en','zh','ja'].includes(lang) ? lang : 'ko';
    if (!labels.has(locale)) labels.set(locale, new Intl.DisplayNames([locale], {type:'region'}));
    return labels.get(locale);
  }
  const name = (code, lang) => display(lang).of(normalize(code));
  function list(lang = 'ko') {
    const compare = new Intl.Collator(lang).compare;
    return codes.map(code => ({code, name:name(code,lang)})).sort((a,b) =>
      a.code === 'KR' ? -1 : b.code === 'KR' ? 1 : compare(a.name,b.name));
  }
  const api = Object.freeze({codes,isValid,normalize,name,list});
  if (typeof module === 'object' && module.exports) module.exports = api;
  else window.IEBCountries = api;
})();
