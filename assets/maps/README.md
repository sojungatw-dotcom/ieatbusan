# 부산 구역 지도 미리보기

- 원본: https://github.com/southkorea/southkorea-maps/tree/master/kostat/2013/json
- 파일: `skorea_municipalities_topo.json` 중 code가 21로 시작하는 부산 16개 구·군만 추출.
- 자료 계열: KOSTAT 2013 센서스용 행정구역 경계. 원 저장소는 해당 자료를 "Free to share or remix"로 안내합니다.
- 원 저장소 출처·이용 안내: https://github.com/southkorea/southkorea-maps#copyright-and-license
- `busan-districts.geojson`은 TopoJSON 공유 경계를 복원한 과거 경계입니다. 최신 공식 행정경계나 정확한 면적·주소 판정 용도로 사용하지 않습니다.
- 화면은 음식 탐색을 위한 구역 선택 미리보기입니다. 작은 도심 구역 이름은 연결선으로 바깥에 배치합니다.
- `node tools/build-district-map.cjs`로 로컬 SVG 경로 데이터 `js/map/district-shapes.js`를 재생성합니다.
- 런타임에는 외부 경계 API를 호출하지 않습니다. 상세 지도는 별도 지도 공급자가 담당합니다.
