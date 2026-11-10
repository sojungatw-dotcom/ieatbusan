# 로컬 챗봇 통합

`로컬 실행.cmd`를 실행하거나 Node.js 22 이상에서 아래 명령을 사용합니다.

```text
node --preserve-symlinks --preserve-symlinks-main tools/dev-server.cjs
```

접속: http://127.0.0.1:8779/

- 모든 화면 오른쪽 아래의 둥근 정사각형 `무` 아이콘을 누릅니다.
- 모바일(740px 이하)은 `#/chatbot` 전용 화면으로 이동하며, 닫기/뒤로가기로 이전 화면으로 돌아갑니다.
- 웹은 오른쪽 하단 팝업으로 열립니다. 기본 480px, 확대 최대 약 693px이며 화면 크기에 맞게 줄어듭니다.
- 닫았다 다시 열거나 앱 화면을 바꿔도 해당 탭 안의 대화는 유지됩니다. 새로고침/새 대화로 초기화합니다.
- 챗봇의 안내 언어는 한국어입니다. 기존 앱의 4개 국어 화면은 유지했습니다.

## 데이터와 동작

`chatbot/index.html`은 앱의 `js/data/foods.js`를 직접 읽습니다. 음식 사진도 공용 `assets/food`를 사용해 중복 저장하지 않습니다. 현재 음식 43개, 대화 예시 44개입니다. 운영 DB의 실시간 카탈로그/회원 정보는 챗봇에 전달하지 않으며 대화 내용을 외부 AI나 서버에 보내지 않습니다.

질문 순서: 식단·알레르기 여부 → 있다고 응답한 경우만 알레르기 항목 복수 선택 → 비건 후보 표시 여부(해당 시) → 한 끼 종류 → 종류별 주재료·음식 형태와 맵기 → 확인 → 음식 후보.

원하는 음식이 없으면 식단·알레르기·추가 제외는 유지한 채 종류·주재료·맵기 취향을 넓힌 다른 후보를 최대 3개 무작위로 보여 줍니다. 후보가 부족하면 가능한 만큼만 안내합니다. 비건 적합성 및 알레르기 안전성은 식당 확인이 필요합니다.

챗봇과 음식 탐색은 `.env.local` 없이도 공용 로컬 데이터로 동작합니다. 로그인·게시글·실제 DB 연결 및 Google 지도는 기존 서버 환경변수 설정이 필요합니다. 환경변수 없이 실행하면 서버 연결 안내와 지도 대체 안내가 표시될 수 있습니다.

## 구성

- `js/chatbot-widget.js`, `css/chatbot-widget.css`: 앱의 진입 버튼, 팝업/모바일 경로, 닫기·확대와 대화 프레임 유지
- `chatbot/`: 독립 대화 화면, 규칙, 예시, 공용 데이터 어댑터
- `tools/sync-chatbot.cjs`: 상위 `chatbot-lab/dist`에서 검증된 UI/로직을 가져와 앱에 맞게 연결합니다. 독립 챗봇 변경 시 재실행합니다. 생성된 `chatbot/`도 함께 전달해야 하며 앱 실행에 원본 lab 폴더는 필요하지 않습니다.
- `tests/chatbot.cjs`: 공용 데이터·이미지 참조, 44개 대화 경로, 앱의 닫기와 재열기 검사

기존 앱의 헤더/메뉴 위에 챗봇이 열리도록 겹침 순서를 조정했습니다. 모바일에서는 배경 앱에 `inert`를 적용하고 화면 스크롤을 막습니다. 팝업은 모달이 아니어서 웹에서는 배경 앱도 계속 사용할 수 있습니다.

검사:

```text
node --preserve-symlinks --preserve-symlinks-main tools/build-static.cjs
node --preserve-symlinks --preserve-symlinks-main tests/chatbot.cjs
node --preserve-symlinks --preserve-symlinks-main tests/deployment.cjs
```

이번 작업은 로컬 통합입니다. SQL 실행, 원격 push, 서비스 배포는 하지 않았습니다.
