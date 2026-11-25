# 팀2 챗봇 이관 시연 사이트 (공개용)

쇼핑몰 AI 챗봇의 상담사 이관 최적화 프로젝트를 직접 만져 보는 정적 사이트입니다. 서버가 없고, 시연 기록은 여는 사람의 브라우저(localStorage)에만 남습니다.

## 폴더

- `index.html`: 첫 화면. 고객용 챗봇 · 주연님 v2 챗봇 · 관리자 콘솔을 3분할로 바로 띄웁니다(1100px 미만은 탭). 원본 iframe은 읽기만 하고, 시연 문장은 복사 칩으로 줍니다.
- `overview/`: 기존 긴 설명 화면(시연 입구, 발표 숫자 요약, 판정 엔진 4개 비교, 링크, 출처)
- `chatbot1/`: 고객용 챗봇 껍데기. `app/customer.html`은 원본 그대로입니다. 이 주소에서는 규칙 모드만 동작합니다.
- `chatbot2/`: 팀 모델 v2 + 규칙 안전장치 챗봇 껍데기. `app/index.html`, `app/v2/**`는 원본 그대로입니다.
- `admin/`: 관리자 콘솔. 두 챗봇의 이관 기록과 발화별 판정을 이 브라우저에서만 보여 줍니다. 단독으로 열어도, 첫 화면의 세 번째 칸으로 들어가도 같은 화면입니다.
- `verify/`: 지어낸 40문장을 이 브라우저의 v2로 다시 채점해 파이썬 채점값과 맞춰 봅니다 (`bench40.json`).
- `map/`: 프로젝트 지도(mermaid) 8장. `handoff-map.html`은 대화형 지도입니다.
- `slides/`: 발표 슬라이드와 `insert/` 추가 그림 5장.
- `replay/`: 녹화된 Claude 판정. 지어낸 40문장에 Claude가 3회 낸 판정을 `claude40.json`으로 보여 줍니다(실시간 아님).
- `benchmark/`: 판정 엔진 4개 벤치마크 결과표.
- `stage-demo/`: 단계 인지형 답변 추천 시연판 (변경 없음).
- `assets/`: `numbers.json`(화면에 나오는 모든 숫자의 한 곳), `nums.js`, `bridge.js`, `site.css`.

## 원칙

- 원본 무수정: `chatbot1/app/customer.html`, `chatbot2/app/index.html`, `chatbot2/app/v2/**`는 저장·재포맷하지 않습니다. 껍데기가 iframe을 읽기만 합니다(`assets/bridge.js`).
- 숫자는 `assets/numbers.json`에서만 읽어 표시합니다. 각 숫자에 조건과 출처가 붙어 있습니다.
- 외부 스크립트는 cdn.jsdelivr.net만 씁니다(챗봇 2의 onnxruntime-web, 지도의 mermaid 고정 버전).

## 출처

- 데이터: AI 허브 「민원(콜센터) 질의-응답 데이터」
- 40문장은 팀이 지어낸 문장이고, 기대 라벨은 팀 제안값입니다. 실제 상담 원문이 아닙니다.
