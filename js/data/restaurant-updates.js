/* 확인 필요 식당을 제외한 운영정보: 2026-11-06 공개 안내 대조 결과. */
(function () {
  'use strict';
  const updates = [
  {
    "food": "busan-wandang",
    "index": 0,
    "address": "부산 부산진구 서면문화로 16",
    "hours": "월·화·수·목·금·토 10:00–21:00",
    "holiday": "일요일"
  },
  {
    "food": "busan-wandang",
    "index": 2,
    "address": "부산 중구 비프광장로 31",
    "hours": "월~일 10:30–20:00",
    "holiday": "연중무휴"
  },
  {
    "food": "dwaeji-gukbap",
    "index": 3,
    "address": "부산광역시 동구 중앙대로533번길 4",
    "hours": "월~토 10:00–19:00",
    "holiday": "일요일, 명절"
  },
  {
    "food": "milmyeon",
    "index": 5,
    "address": "부산 부산진구 새싹로 249-1",
    "hours": "월~일 10:00–21:00",
    "holiday": "연중무휴"
  },
  {
    "food": "jobang-nakji",
    "index": 3,
    "address": "중구 신창동2가",
    "hours": "월~일 11:00–21:00 (마지막 주문 20:30)",
    "holiday": "연중무휴"
  },
  {
    "food": "gorae-gogi",
    "index": 2,
    "address": "부산 중구 자갈치로 58",
    "hours": "월·수·목·금·토·일 14:00–23:30",
    "holiday": "화요일"
  },
  {
    "food": "kkomjangeo",
    "index": 4,
    "address": "부산 중구 자갈치로 58",
    "hours": "월·수·목·금·토·일 14:00–23:30",
    "holiday": "화요일"
  },
  {
    "food": "meongge-bibimbap",
    "index": 0,
    "address": "부산 서구 송도해변로 9",
    "hours": "화·수·목·금·토·일 11:00–19:30",
    "holiday": "월요일"
  },
  {
    "food": "sogogi-gukbap",
    "index": 2,
    "address": "부산 기장군 철마면 웅천리 221-4",
    "hours": "화·수·목·금·토·일 11:00–16:30",
    "holiday": "월요일"
  },
  {
    "food": "andong-jjimdak",
    "index": 0,
    "address": "부산 서구 구덕로 140-1",
    "hours": "월·화·수·목·금·토 10:00–22:00",
    "holiday": "일요일"
  },
  {
    "food": "bokguk",
    "index": 0,
    "address": "부산 해운대구 중동1로43번길 23",
    "hours": "24시간 영업",
    "holiday": "연중무휴"
  },
  {
    "food": "gijang-daege",
    "index": 0,
    "address": "부산광역시 기장군 기장읍 읍내로104번길 16 기장시장",
    "hours": "월~일 09:00–20:30 (마지막 주문 20:00)",
    "holiday": "연중무휴"
  },
  {
    "food": "yubu-jumeoni",
    "index": 0,
    "address": "부산 중구 부평3길 29",
    "hours": "월·수·목·금·토·일 10:00–18:00",
    "holiday": "화요일"
  },
  {
    "food": "mungtigi",
    "index": 3,
    "address": "부산 수영구 수영로652번길 12",
    "hours": "수·목 18:00–다음 날 01:00 / 금·토 18:00–다음 날 02:00",
    "holiday": "일요일 월요일 화요일"
  },
  {
    "food": "namhae-myeolchi-ssambap",
    "index": 2,
    "address": "부산 부산진구 가야대로765번길 24",
    "hours": "월·화·수·목·금·토 10:30–21:00",
    "holiday": "일요일"
  },
  {
    "food": "ssiat-hotteok",
    "index": 1,
    "address": "부산 중구 비프광장로 36",
    "hours": "월·화·수·목·금 10:00–21:00",
    "holiday": "일요일 토요일"
  },
  {
    "food": "gijang-myeolchi",
    "index": 1,
    "address": "부산 기장군 기장읍 기장해안로 572",
    "hours": "월·화·수·금·토·일 10:30–21:30",
    "holiday": "목요일"
  },
  {
    "food": "milmyeon",
    "index": 0,
    "address": "부산 남구 우암번영로26번길 17",
    "hours": "월~일 10:30–19:00",
    "holiday": "연중무휴"
  },
  {
    "food": "dodari-ssukguk",
    "index": 1,
    "address": "부산 연제구 월드컵대로99번길 37",
    "hours": "월·화·수·목·금·토 11:00–22:00",
    "holiday": "일요일"
  },
  {
    "food": "naengchae-jokbal",
    "index": 4,
    "address": "부산 부산진구 부전로96번길 32",
    "hours": "월·화·수·목·금·토 17:00–23:00",
    "holiday": "일요일"
  },
  {
    "food": "sogogi-gukbap",
    "index": 3,
    "address": "부산 연제구 월드컵대로111번길 4",
    "hours": "화·수·목·금·토 09:00–21:00 / 일 09:00–15:00",
    "holiday": "월요일"
  },
  {
    "food": "dongnae-pajeon",
    "index": 0,
    "address": "부산 동래구 명륜로94번길 43-10",
    "hours": "화·수·목·금 11:30–21:30 / 토·일 11:30–21:00",
    "holiday": "월요일"
  },
  {
    "food": "busan-wandang",
    "index": 1,
    "address": "부산 수영구 수영로679번길 26",
    "hours": "월·화·수·목·금·토 11:00–20:00",
    "holiday": "일요일"
  },
  {
    "food": "kkomjangeo",
    "index": 11,
    "address": "부산 해운대구 구남로41번길 8",
    "hours": "월·수·목·금·토·일 08:00–23:00",
    "holiday": "화요일"
  },
  {
    "food": "namhae-myeolchi-ssambap",
    "index": 0,
    "address": "부산 중구 백산길 10",
    "hours": "월·화·수·목·금·토 08:00–20:00",
    "holiday": "일요일"
  },
  {
    "food": "mungtigi",
    "index": 0,
    "address": "부산 사하구 낙동대로563번안길 68",
    "hours": "월·화·수·목 16:00–다음 날 01:00 / 금·토 16:00–다음 날 02:00",
    "holiday": "일요일"
  },
  {
    "food": "hadong-jaecheopguk",
    "index": 5,
    "address": "부산 강서구 신호일로 203",
    "hours": "월·화·수·목·금·토 08:00–20:00",
    "holiday": "일요일"
  },
  {
    "food": "mungtigi",
    "index": 1,
    "address": "부산 사하구 낙동대로563번안길 35-2",
    "hours": "월·화·수·목·금·토 17:00–다음 날 02:00",
    "holiday": "일요일"
  },
  {
    "food": "eomuk",
    "index": 2,
    "address": "부산광역시 중구 중구로43번길 31",
    "hours": "월~일 07:00–19:00",
    "holiday": "연중무휴"
  },
  {
    "food": "bokguk",
    "index": 2,
    "address": "부산광역시 해운대구 달맞이길62번길 27-1",
    "hours": "화~일 07:00–15:00 (마지막 주문 14:20)",
    "holiday": "매주 월요일"
  },
  {
    "food": "gijang-myeolchi",
    "index": 3,
    "address": "부산 기장군 기장읍 대변2길 1",
    "hours": "영업일 09:00–20:00 (정기휴무일 제외)",
    "holiday": "매월 두번째, 네번째 수요일"
  },
  {
    "food": "gorae-gogi",
    "index": 1,
    "address": "부산 수영구 광안해변로 31-13",
    "hours": "월·화·수·목·금·토 15:00–21:30",
    "holiday": "일요일"
  },
  {
    "food": "namhae-myeolchi-ssambap",
    "index": 1,
    "address": "부산 강서구 명지오션시티8로 27",
    "hours": "화·수·목·금·토·일 10:30–21:00",
    "holiday": "월요일"
  },
  {
    "food": "dwaeji-gukbap",
    "index": 5,
    "address": "부산 중구 대청로141번길 15-1",
    "hours": "월·화·수·목·금 10:00–19:30 / 토 10:00–14:00",
    "holiday": "일요일"
  },
  {
    "food": "jagalchi-hoe",
    "index": 3,
    "address": "부산 중구 자갈치해안로 55",
    "hours": "영업일 11:00–21:00 (정기휴무일 제외)",
    "holiday": "매월 첫번째, 세번째 월요일"
  },
  {
    "food": "naengchae-jokbal",
    "index": 0,
    "address": "부산 중구 광복로 13-1",
    "hours": "월~일 10:00–24:00",
    "holiday": "연중무휴"
  },
  {
    "food": "kkomjangeo",
    "index": 10,
    "address": "부산 서구 자갈치로 12-1",
    "hours": "영업일 10:00–22:00 (정기휴무일 제외)",
    "holiday": "매월 두번째, 다섯번째 목요일"
  },
  {
    "food": "multteok",
    "index": 4,
    "address": "부산 동구 중앙대로 192",
    "hours": "월·화·수·목·금·토 11:00–22:00",
    "holiday": "일요일"
  },
  {
    "food": "gwamegi",
    "index": 2,
    "address": "부산 수영구 황령대로489번길 49-8",
    "hours": "월·화·수·목·금·토 17:00–22:00",
    "holiday": "일요일"
  },
  {
    "food": "bibim-dangmyeon",
    "index": 0,
    "address": "중구 부평동",
    "hours": "월·화·수·금·토·일 10:30–18:00",
    "holiday": "목요일"
  },
  {
    "food": "multteok",
    "index": 0,
    "address": "부산 중구 부평2길 39",
    "hours": "월·화·수·금·토·일 10:30–18:00",
    "holiday": "목요일"
  },
  {
    "food": "hadong-jaecheopguk",
    "index": 2,
    "address": "부산 사하구 장평로 170",
    "hours": "영업일 08:00–21:00 (정기휴무일 제외)",
    "holiday": "매월 두번째, 네번째 일요일"
  },
  {
    "food": "eomuk",
    "index": 0,
    "address": "부산광역시 영도구 태종로99번길 36",
    "hours": "월~일 09:00–19:00",
    "holiday": "연중무휴"
  },
  {
    "food": "naengchae-jokbal",
    "index": 3,
    "address": "부산광역시 서구 대영로 43-2",
    "hours": "월~일 11:00–24:00",
    "holiday": "연중무휴"
  },
  {
    "food": "chungmu-gimbap",
    "index": 2,
    "address": "부산 수영구 광안해변로15번길 77",
    "hours": "화·수·목·금·토·일 07:00–19:00",
    "holiday": "월요일"
  },
  {
    "food": "hadong-jaecheopguk",
    "index": 0,
    "address": "부산 중구 보수대로 58",
    "hours": "월·화·수·목·금·일 08:00–20:30",
    "holiday": "토요일"
  },
  {
    "food": "jobang-nakji",
    "index": 2,
    "address": "동래구 명륜동",
    "hours": "화·수·목·금·토·일 11:00–21:00",
    "holiday": "월요일"
  },
  {
    "food": "nakgopsae",
    "index": 2,
    "address": "부산광역시 동래구 명륜로94번길 37",
    "hours": "화·수·목·금·토·일 11:00–21:00",
    "holiday": "월요일"
  },
  {
    "food": "dongnae-pajeon",
    "index": 2,
    "address": "부산광역시 동래구 금강공원로 55",
    "hours": "월~일 11:00–22:00",
    "holiday": "연중무휴"
  },
  {
    "food": "cheongsapo-jogae",
    "index": 0,
    "address": "부산광역시 해운대구 청사포로58번길 118",
    "hours": "영업일 11:30–다음 날 05:00",
    "holiday": "연중무휴"
  },
  {
    "food": "dwaeji-gukbap",
    "index": 0,
    "address": "부산 수영구 광안해변로370번길 9-32 1층",
    "hours": "24시간 영업",
    "holiday": "연중무휴"
  },
  {
    "food": "dodari-ssukguk",
    "index": 3,
    "address": "부산 부산진구 연수로 18-1",
    "hours": "월·수·목·금·토·일 11:30–22:30",
    "holiday": "화요일"
  },
  {
    "food": "gijang-daege",
    "index": 3,
    "address": "부산광역시 기장군 기장읍 차성동로67번길 12 2층",
    "hours": "월~일 09:00–21:00",
    "holiday": "연중무휴"
  },
  {
    "food": "eonyang-bulgogi",
    "index": 0,
    "address": "부산 수영구 남천바다로 32",
    "hours": "월·화·수·목·금·일 11:00–21:30 / 토 11:00–22:00",
    "holiday": "연중무휴"
  },
  {
    "food": "dwaeji-gukbap",
    "index": 9,
    "address": "부산광역시 사하구 하신번영로157번길 39",
    "hours": "월·화·수·목·금·토 09:30–21:30",
    "holiday": "일요일"
  },
  {
    "food": "kkomjangeo",
    "index": 9,
    "address": "부산 동래구 명륜로98번길 9",
    "hours": "영업일 15:30–24:00 (정기휴무일 제외)",
    "holiday": "매월 첫번째, 두번째 일요일"
  },
  {
    "food": "nakgopsae",
    "index": 1,
    "address": "부산광역시 부산진구 골드테마길 10",
    "hours": "영업일 09:30–20:30 (마지막 주문 20:00)",
    "holiday": "연중무휴 (명절 별도 확인)"
  },
  {
    "food": "busan-wandang",
    "index": 3,
    "address": "부산광역시 서구 구덕로238번길 6",
    "hours": "화~일 10:30–19:30 (마지막 주문 19:00)",
    "holiday": "매주 월요일"
  },
  {
    "food": "milmyeon",
    "index": 6,
    "address": "부산 금정구 부산대학로64번길 112",
    "hours": "월·화·수·목·금 11:00–15:00",
    "holiday": "일요일 토요일"
  },
  {
    "food": "kkomjangeo",
    "index": 2,
    "address": "부산 기장군 기장읍 공수2길 5",
    "hours": "월~일 11:00–21:00",
    "holiday": "연중무휴"
  },
  {
    "food": "jobang-nakji",
    "index": 1,
    "address": "부산광역시 부산진구 골드테마길 10",
    "hours": "영업일 09:30–20:30 (마지막 주문 20:00)",
    "holiday": "연중무휴 (명절 별도 확인)"
  },
  {
    "food": "gijang-myeolchi",
    "index": 2,
    "address": "부산 기장군 기장읍 기장해안로 560-5",
    "hours": "월·화·목·금 10:00–20:30 / 토·일 10:00–21:00",
    "holiday": "수요일"
  },
  {
    "food": "haeundae-galbi",
    "index": 2,
    "address": "부산 해운대구 해운대로570번길 49",
    "hours": "월~일 11:30–22:00",
    "holiday": "연중무휴"
  },
  {
    "food": "yubu-jumeoni",
    "index": 1,
    "address": "부산광역시 중구 중구로43번길 19-1",
    "hours": "월~일 11:00–19:00 (마지막 주문 18:00)",
    "holiday": "연중무휴"
  },
  {
    "food": "kkomjangeo",
    "index": 7,
    "address": "부산 동래구 명륜로98번길 52",
    "hours": "영업일 13:00–21:00 (정기휴무일 제외)",
    "holiday": "매월 네번째 일요일"
  },
  {
    "food": "jobang-nakji",
    "index": 6,
    "address": "부산 중구 해관로 63-1",
    "hours": "월·화·수·목·금·토 10:00–22:00",
    "holiday": "일요일"
  },
  {
    "food": "nakgopsae",
    "index": 5,
    "address": "부산 중구 해관로 63-1",
    "hours": "월·화·수·목·금·토 10:00–22:00",
    "holiday": "일요일"
  },
  {
    "food": "hadong-jaecheopguk",
    "index": 1,
    "address": "부산 사하구 하신번영로 432",
    "hours": "영업일 11:30–21:00 (정기휴무일 제외)",
    "holiday": "매월 첫번째, 세번째 일요일"
  },
  {
    "food": "milmyeon",
    "index": 1,
    "address": "부산 부산진구 서면문화로 48-1",
    "hours": "월~일 10:00–21:30",
    "holiday": "연중무휴"
  },
  {
    "food": "chungmu-gimbap",
    "index": 0,
    "address": "부산 동구 고관로 122-1",
    "hours": "월·화·수·목·금·토 11:30–20:00",
    "holiday": "일요일"
  },
  {
    "food": "chungmu-gimbap",
    "index": 5,
    "address": "부산 부산진구 중앙대로691번길 55",
    "hours": "24시간 영업",
    "holiday": "연중무휴"
  },
  {
    "food": "namhae-myeolchi-ssambap",
    "index": 3,
    "address": "부산 사하구 낙동남로1389번길 9-2",
    "hours": "월·화·수·목·금·토 10:00–21:00",
    "holiday": "일요일"
  },
  {
    "food": "dwaeji-gukbap",
    "index": 2,
    "address": "부산 남구 용호로 235",
    "hours": "월~일 09:00–19:30",
    "holiday": "연중무휴"
  },
  {
    "food": "dwaeji-gukbap",
    "index": 8,
    "address": "부산광역시 사상구 광장로 34",
    "hours": "24시간 영업",
    "holiday": "연중무휴"
  },
  {
    "food": "sogogi-gukbap",
    "index": 0,
    "address": "부산 해운대구 구남로21번길 33",
    "hours": "월·화·목·금·토·일 24시간 영업",
    "holiday": "수요일"
  },
  {
    "food": "eomuk",
    "index": 3,
    "address": "부산광역시 동구 초량동 1187-20 부산역사 2층",
    "hours": "월~일 06:30–22:00",
    "holiday": "연중무휴"
  }
];
  const foods = new Map((window.FOODS || []).map(food => [food.id, food]));
  for (const update of updates) {
    const food = foods.get(update.food), place = food?.places?.[update.index];
    if (!place) continue;
    Object.assign(place, { address: update.address, hours: update.hours, holiday: update.holiday });
    if (place.research) Object.assign(place.research, { area: update.address, hours: update.hours, holiday: update.holiday });
    for (const language of ['ko', 'en', 'zh', 'ja']) {
      const info = food[language]?.restaurants?.[update.index];
      if (info) info.area = update.address;
    }
  }
})();

/* Provided operating information, 2026-11-06: hours/days only; addresses are unchanged. */
(function () {
  'use strict';
  const updates = [
  {
    "food": "kkomjangeo",
    "index": 12,
    "name": "3대 기장산 곰장어",
    "hours": "월~일 10:00–22:00",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "milmyeon",
    "index": 8,
    "name": "개금밀면",
    "hours": "월~일 11:00–20:00",
    "holiday": "확인 필요 (제공 자료에 월~일 휴무로 기재되어 월~일 영업시간 안내와 상충)"
  },
  {
    "food": "nakgopsae",
    "index": 6,
    "name": "개미집",
    "hours": "24시간 영업",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "nakgopsae",
    "index": 3,
    "name": "개미집 본점",
    "hours": "월~일 11:00–21:00",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "eomuk",
    "index": 1,
    "name": "고래사어묵 해운대점",
    "hours": "월·화·수·목·일 09:00–21:00 / 금 09:00–21:30 / 토 09:00–22:00",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "milmyeon",
    "index": 3,
    "name": "국제밀면",
    "hours": "월~일 10:00–20:00",
    "holiday": "확인 필요"
  },
  {
    "food": "kkomjangeo",
    "index": 3,
    "name": "기장곰장어",
    "hours": "확인 필요",
    "holiday": "확인 필요"
  },
  {
    "food": "ssiat-hotteok",
    "index": 2,
    "name": "남포동 씨앗호떡",
    "hours": "10:00-23:00",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "daegu-napjak-mandu",
    "index": 0,
    "name": "남포동 육소문",
    "hours": "16:00– 01:00",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "daegu-napjak-mandu",
    "index": 1,
    "name": "다래분식",
    "hours": "월~일 09:00–19:30",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "sogogi-gukbap",
    "index": 1,
    "name": "다원정 한우소고기국밥 동아대병원점",
    "hours": "월-금 08:00-20:00 일 08:30-20:00(Last order 19:30)",
    "holiday": "매주 토요일"
  },
  {
    "food": "jagalchi-hoe",
    "index": 2,
    "name": "달봉이횟집",
    "hours": "영업일 12:00–21:00 (Last order 19:30)",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "gijang-daege",
    "index": 2,
    "name": "대게만찬 기장점",
    "hours": "11:00 - 21:40 (Last order 20:30)",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "mungtigi",
    "index": 2,
    "name": "대도회관",
    "hours": "월~일 11:30–23:00(Last order 22:30)",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "gwamegi",
    "index": 1,
    "name": "대박집",
    "hours": "월~일 15:00–24:00",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "meongge-bibimbap",
    "index": 1,
    "name": "대박집 물회",
    "hours": "월~일 11:00–21:00 (Last order 20:30)",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "gwamegi",
    "index": 0,
    "name": "도화",
    "hours": "월·화·수·목·금·토 16:00–24:00 / 일 16:00–23:00",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "cheongsapo-jogae",
    "index": 1,
    "name": "도희네",
    "hours": "10:00-05:00",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "dwaeji-gukbap",
    "index": 4,
    "name": "동동국밥 부산동래점",
    "hours": "11:00–21:30",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "kkomjangeo",
    "index": 0,
    "name": "동성장어구이",
    "hours": "영업일 11:00–22:00 (Last order 21:10)",
    "holiday": "매월 둘째·넷째 목요일"
  },
  {
    "food": "kkomjangeo",
    "index": 1,
    "name": "등대할매집",
    "hours": "영업일 11:00–22:00",
    "holiday": "확인 필요 (둘째·넷째 월요일 휴무 후기 있음 / 매주 월요일 휴무 안내와 상충하여 전화확인)"
  },
  {
    "food": "eonyang-bulgogi",
    "index": 2,
    "name": "등불",
    "hours": "11:00–22:00 (Last order 21:00)",
    "holiday": "확인 필요 (2025년 후기 기준, 최신 휴무일 확인 필요)"
  },
  {
    "food": "kkomjangeo",
    "index": 5,
    "name": "뚱보할매집",
    "hours": "07:00–24:00",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "masan-agujjim",
    "index": 1,
    "name": "마산 생아구찜",
    "hours": "11:00–21:00 (2024년 후기 10:00–24:00과 상충, 확인 필요)",
    "holiday": "확인 필요"
  },
  {
    "food": "jobang-nakji",
    "index": 4,
    "name": "명품물회 송도점",
    "hours": "11:00–21:00 (평일 Break time 15:00–17:00 / Last order 20:30)",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "cheongdo-minari-samgyeopsal",
    "index": 0,
    "name": "목구멍 하단점",
    "hours": "16:30–다음 날 02:00",
    "holiday": "확인 필요 (최근 후기 기준 / 월요일·일요일 휴무 안내와 상충하여 확인 필요)"
  },
  {
    "food": "mungtigi",
    "index": 4,
    "name": "못잊어",
    "hours": "17:00–다음 날 02:00 (Last order 00:00)",
    "holiday": "확인 필요 (최근 후기 기준 / 월요일 휴무 안내와 상충하여 확인 필요)"
  },
  {
    "food": "meongge-bibimbap",
    "index": 2,
    "name": "박해윤 통영 해물밥상",
    "hours": "11:00–22:00 (토·일 Break time 15:00–15:30 / Last order 20:50)",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "ssiat-hotteok",
    "index": 5,
    "name": "별난씨호떡",
    "hours": "월·화·수·목·금 15:00–22:00 / 토·일 12:30–22:00",
    "holiday": "정기휴무 없음 (월~일 영업; 지도 등록 기준, 별도 휴무 안내 없음)"
  },
  {
    "food": "ssiat-hotteok",
    "index": 3,
    "name": "보배호떡",
    "hours": "지도 13:00–21:30 / 후기 월~금 13:00–21:00, 토 13:30–21:00 (상충하여 확인 필요)",
    "holiday": "확인 필요 (지도 기준 / 후기에는 월,화,수,목,금,토 영업·일요일 휴무로 안내되어 확인 필요)"
  },
  {
    "food": "dwaeji-gukbap",
    "index": 7,
    "name": "본전돼지국밥",
    "hours": "08:40–21:00 (Last order 20:30)",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "gwamegi",
    "index": 3,
    "name": "봉자네 실비집",
    "hours": "14:00–23:00",
    "holiday": "정기휴무 없음 (월~일 영업; 지도 등록 기준, 별도 휴무 안내 없음)"
  },
  {
    "food": "naengchae-jokbal",
    "index": 2,
    "name": "부평족발",
    "hours": "11:00–24:00 (일부 후기 10:00 개장으로 안내되어 개장 시간 확인 필요)",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "eonyang-bulgogi",
    "index": 1,
    "name": "사계 언양불고기",
    "hours": "11:00–23:00 (Last order 22:00)",
    "holiday": "정기휴무 없음 (월~일 영업)"
  },
  {
    "food": "multteok",
    "index": 1,
    "name": "상국이네",
    "hours": "월·화·목·금·토·일 10:00–다음 날 01:00 (Last order 00:30)",
    "holiday": "매주 수요일"
  },
  {
    "food": "daegu-makchang",
    "index": 0,
    "name": "성애문현곱창",
    "hours": "월·화·수·목·금·토 16:00–24:00 (Last order 23:00) / 일 17:00–22:00 (Last order 21:00)",
    "holiday": "정기휴무 없음 (월~일 영업; 지도 등록 기준, 별도 휴무 안내 없음)"
  },
  {
    "food": "gorae-gogi",
    "index": 3,
    "name": "소나무회",
    "hours": "11:30–22:00 (Break time 15:00–16:30 / Last order 21:00)",
    "holiday": "확인 필요"
  },
  {
    "food": "yeongdeok-uljin-daege",
    "index": 1,
    "name": "소화식당",
    "hours": "17:00–다음 날 03:30",
    "holiday": "확인 필요 (지도 및 2024년 후기 기준, 최신 휴무일 확인 필요)"
  },
  {
    "food": "yeongdeok-uljin-daege",
    "index": 2,
    "name": "소화식당 수영점",
    "hours": "확인 필요",
    "holiday": "확인 필요"
  },
  {
    "food": "ssiat-hotteok",
    "index": 4,
    "name": "승기 씨앗호떡",
    "hours": "확인 필요",
    "holiday": "확인 필요"
  },
  {
    "food": "jagalchi-hoe",
    "index": 1,
    "name": "신동아수산물시장 회센터",
    "hours": "시장 안내 06:00–22:00 (개별 회센터 점포 시간은 별도 확인 필요)",
    "holiday": "매월 둘째·넷째 화요일"
  },
  {
    "food": "dwaeji-gukbap",
    "index": 1,
    "name": "쌍둥이돼지국밥",
    "hours": "월~일 09:00–22:00"
  },
  {
    "food": "masan-agujjim",
    "index": 0,
    "name": "양대감 대구탕",
    "hours": "24시간 영업"
  },
  {
    "food": "yeongdo-jeonbokjuk",
    "index": 0,
    "name": "영도해녀촌",
    "hours": "09:00–19:00 (기상 상황·개별 점포에 따라 변동)"
  },
  {
    "food": "gorae-gogi",
    "index": 0,
    "name": "영란 고래고기",
    "hours": "월~일 13:00–23:00"
  },
  {
    "food": "andong-jjimdak",
    "index": 1,
    "name": "옛날통닭",
    "hours": "월·화·수·목·금·토 17:30–다음 날 06:00 / 일 17:30–다음 날 05:00"
  },
  {
    "food": "multteok",
    "index": 2,
    "name": "옥당분식",
    "hours": "확인 필요",
    "holiday": "매주 일요일"
  },
  {
    "food": "milmyeon",
    "index": 2,
    "name": "원조 개금밀면",
    "hours": "월~일 11:00–20:00"
  },
  {
    "food": "multteok",
    "index": 3,
    "name": "원조 꼬마김밥",
    "hours": "확인 필요"
  },
  {
    "food": "ssiat-hotteok",
    "index": 0,
    "name": "원조 승기 씨앗호떡",
    "hours": "확인 필요"
  },
  {
    "food": "bibim-dangmyeon",
    "index": 1,
    "name": "원조깡통비빔당면",
    "hours": "확인 필요"
  },
  {
    "food": "dongnae-pajeon",
    "index": 1,
    "name": "원조동래파전",
    "hours": "확인 필요"
  },
  {
    "food": "dodari-ssukguk",
    "index": 2,
    "name": "율선횟집",
    "hours": "확인 필요"
  },
  {
    "food": "kkomjangeo",
    "index": 8,
    "name": "자갈치 곰장어",
    "hours": "월~일 13:00–23:00"
  },
  {
    "food": "jagalchi-hoe",
    "index": 0,
    "name": "자갈치시장 (활어부·2층 회식당)",
    "hours": "시장 안내 05:00–22:00 (2층 회식당은 점포별 확인 필요)",
    "holiday": "매월 첫째·셋째·다섯째 화요일"
  },
  {
    "food": "gijang-myeolchi",
    "index": 0,
    "name": "장군멸치회촌",
    "hours": "영업일 09:30–20:00",
    "holiday": "매주 월요일"
  },
  {
    "food": "dwaeji-gukbap",
    "index": 6,
    "name": "정아 밀면 돼지국밥",
    "hours": "월~일 10:00–22:00"
  },
  {
    "food": "cheongsapo-jogae",
    "index": 3,
    "name": "제이제이가리비 청사포 본점",
    "hours": "일~금 12:00–22:00 / 토 12:00–24:00"
  },
  {
    "food": "cheongsapo-jogae",
    "index": 2,
    "name": "조개뷰 해운대본점",
    "hours": "일~금 11:30–24:00 (마지막 주문 23:30) / 토 11:30–다음 날 01:00 (마지막 주문 00:30)"
  },
  {
    "food": "nakgopsae",
    "index": 0,
    "name": "조방낙지 범일직영점",
    "hours": "월~일 11:00–22:00"
  },
  {
    "food": "jobang-nakji",
    "index": 0,
    "name": "조방낙지 범일직영점",
    "hours": "월~일 11:00–22:00"
  },
  {
    "food": "nakgopsae",
    "index": 4,
    "name": "조방낙지 주례점",
    "hours": "월~일 10:30–23:00"
  },
  {
    "food": "jobang-nakji",
    "index": 5,
    "name": "조방낙지 주례점",
    "hours": "월~일 10:30–23:00"
  },
  {
    "food": "gijang-daege",
    "index": 1,
    "name": "조은대게",
    "hours": "영업일 09:00–21:00 (마지막 주문 20:30)"
  },
  {
    "food": "kkomjangeo",
    "index": 6,
    "name": "주연네 곰장어",
    "hours": "월~일 11:00–23:30"
  },
  {
    "food": "jinju-naengmyeon",
    "index": 0,
    "name": "진주냉면 대연본점",
    "hours": "월~일 10:30–20:30"
  },
  {
    "food": "dodari-ssukguk",
    "index": 0,
    "name": "진주네 횟집",
    "hours": "월~일 11:00–23:00"
  },
  {
    "food": "jinju-bibimbap",
    "index": 0,
    "name": "진주비빔밥",
    "hours": "확인 필요",
    "holiday": "매주 토요일·일요일 및 공휴일"
  },
  {
    "food": "yeongdeok-uljin-daege",
    "index": 0,
    "name": "천성중앙횟집",
    "hours": "월·화·수·목 10:00–19:00 / 금 10:00–20:30 / 토·일 10:00–21:30"
  },
  {
    "food": "milmyeon",
    "index": 7,
    "name": "초량밀면",
    "hours": "월~일 10:00–21:30"
  },
  {
    "food": "bokguk",
    "index": 1,
    "name": "초원복국 해운대점",
    "hours": "월~일 08:00–21:00"
  },
  {
    "food": "chungmu-gimbap",
    "index": 1,
    "name": "충무명물 김밥세상",
    "hours": "월~일 08:00–22:00"
  },
  {
    "food": "pohang-mulhoe",
    "index": 0,
    "name": "포항물회",
    "hours": "월~일 11:00–21:30"
  },
  {
    "food": "jinju-naengmyeon",
    "index": 1,
    "name": "하기연진주냉면",
    "hours": "확인 필요",
    "holiday": "매주 일요일"
  },
  {
    "food": "hadong-jaecheopguk",
    "index": 3,
    "name": "하동 재첩국",
    "hours": "월~일 05:00–21:00"
  },
  {
    "food": "naengchae-jokbal",
    "index": 1,
    "name": "한양족발",
    "hours": "확인 필요"
  },
  {
    "food": "milmyeon",
    "index": 4,
    "name": "할매 충무김밥",
    "hours": "24시간 영업"
  },
  {
    "food": "chungmu-gimbap",
    "index": 3,
    "name": "할매 충무김밥",
    "hours": "24시간 영업"
  },
  {
    "food": "chungmu-gimbap",
    "index": 4,
    "name": "할매손 충무김밥",
    "hours": "월·화·수·목·금 09:00–21:00 / 토·일 08:00–21:00"
  },
  {
    "food": "hadong-jaecheopguk",
    "index": 4,
    "name": "할매재첩국 부산본점",
    "hours": "월~일 07:00–21:00"
  },
  {
    "food": "milmyeon",
    "index": 9,
    "name": "해운대가야밀면",
    "hours": "월~일 10:00–20:40"
  },
  {
    "food": "haeundae-galbi",
    "index": 0,
    "name": "해운대암소갈비집",
    "hours": "월~일 11:30–22:00"
  },
  {
    "food": "haeundae-galbi",
    "index": 1,
    "name": "해운대이름난암소갈비",
    "hours": "월~일 11:00–23:00"
  },
  {
    "food": "naengchae-jokbal",
    "index": 5,
    "name": "홍소족발",
    "hours": "월·화·수·목·금·토 11:30–23:00 / 일 11:30–22:30"
  }
];
  const foods = new Map((window.FOODS || []).map(food => [food.id, food]));
  for (const update of updates) {
    const place = foods.get(update.food)?.places?.[update.index];
    if (!place || place.name !== update.name) continue;
    const values = { hours: update.hours };
    if (update.holiday !== undefined) values.holiday = update.holiday;
    Object.assign(place, values);
    if (place.research) Object.assign(place.research, values);
  }
})();
