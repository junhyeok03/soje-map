# 소제, 시간의 지도

대전 소제동 철도관사촌의 과거·현재·미래를 탐색하는 인터랙티브 지도입니다. 공용 터치스크린을 우선으로 설계했으며 모바일 화면도 지원합니다.

## 현재 범위

- OpenStreetMap + Leaflet 기반 소제동 지도
- 실제 장소 6곳의 검증 좌표와 이동 동선
- 장소별 과거·현재·미래 탭
- 현재 탭의 대전광역시 사진 아카이브 사진
- 과거·미래 탭의 장소별 AI 상상 이미지 12장
- 걸으며 체험하기: 현장 모드(휴대폰 GPS)와 시연 모드(대전역 출발, 점 드래그·자동 걷기)
- 도착 이벤트: 장소 반경 30m 진입 시 도착 카드, 과거 탭 바로 열기, 방문 표시와 6곳 완주
- 지도 안 길안내: 다음 장소까지 실제 도보 경로 점선, 방향·직선거리·도보 추정 시간
- 카카오맵·구글 지도 도보 길찾기 링크 (지도의 회색 점을 출발지로 사용, API 키 불필요)
- Spring Boot 백엔드 골격과 상태 확인 엔드포인트
- Raspberry Pi 5 온프레미스 배포를 위한 Docker Compose 구성
- GitHub Actions 기반 프론트·백엔드·컨테이너 CI

현재 장소명·주소·좌표는 공개된 주소 및 지도 자료를 대조해 적용했습니다. 현재 사진은 대전광역시 사진 아카이브의 워터마크 웹 게시용 자료이며, 화면에 촬영일과 출처 링크를 표시합니다. 과거와 미래 이미지는 발표용 AI 상상도로서 과거는 역사적 사실 사진이 아니며 미래는 확정 계획이 아닙니다. 화면과 이미지 설명에 이 구분을 명시했습니다. 상세 출처 및 생성 안내는 `public/locations/ATTRIBUTIONS.md`와 `public/locations/generated/README.md`에 정리했습니다. 프론트는 백엔드나 DB를 사용하지 않습니다.

## 기술 구성

- Frontend: React 19, TypeScript, Leaflet, vinext/Vite
- Backend: Java 21, Spring Boot 4.1, Maven
- Deployment: Docker Compose, 외부 Nginx 리버스 프록시

## 로컬 실행

Node.js 22.18 이상이 필요합니다.

```bash
npm install
npm run dev
```

백엔드는 Maven 3.6.3 이상과 Java 21이 필요합니다.

```bash
mvn -f backend/pom.xml spring-boot:run
```

백엔드 상태 확인 경로는 `http://localhost:8080/actuator/health`입니다.

## 작업 시 필수 사항

1. **Node.js 22.18 이상**을 사용합니다. 테스트가 TypeScript 파일(`app/arrival.ts` 등)을 Node로 직접 불러오는데, 이 기능이 22.18부터 기본으로 켜집니다.
2. **장소의 좌표나 순서를 바꾸면 도보 경로를 다시 생성합니다.** 장소 데이터는 `app/locations.ts`에 있고, 시연 모드의 걷기 경로는 `app/walkRoutes.ts`에 미리 저장되어 있습니다. `app/walkRoutes.ts`는 직접 고치지 말고 아래 명령으로 다시 만듭니다(인터넷 연결 필요).

   ```bash
   node scripts/fetch-walk-routes.mjs
   ```

3. **푸시 전에 CI와 같은 검사를 통과시킵니다.**

   ```bash
   npm run typecheck && npm run lint && npm test
   ```

4. **휴대폰 GPS(현장 모드)는 배포된 HTTPS 주소에서 확인합니다.** 휴대폰에서 `http://192.168.x.x:3000` 같은 주소로 접속하면 브라우저가 위치 기능을 막습니다. 노트북 로컬(`http://localhost:3000`)에서는 시연 모드로 확인합니다.
5. **이미지를 추가하면 출처를 함께 적습니다.** 사진은 `public/locations/ATTRIBUTIONS.md`, AI 이미지는 `public/locations/generated/README.md`에 기록하고, AI 이미지는 화면에도 AI 생성임을 표시합니다.

## Docker 실행

Docker Engine과 Docker Compose 플러그인이 설치되어 있으면 첫 실행은 아래
명령 하나로 이미지 빌드와 컨테이너 기동이 함께 진행됩니다.

```bash
docker compose up -d
```

기본 포트는 다음과 같습니다.

- 프론트엔드: `0.0.0.0:18080` — 학교 Nginx가 연결할 포트
- 백엔드: `127.0.0.1:18081` — 현재는 로컬 상태 확인용

포트가 이미 사용 중이거나 관리자가 별도 포트를 지정했다면 `.env.example`을
`.env`로 복사해 값을 변경합니다.

```bash
cp .env.example .env
docker compose up -d
```

첫 실행 후 라즈베리파이에서는 `http://서버IP:18080/`, Nginx를 거친 공개
주소에서는 `https://daisy.wisoft.dev/junhyeok/pj`로 화면을 확인할 수 있습니다.
학교 Nginx가 공개 주소의 `/junhyeok/pj`를 제거한 뒤 컨테이너로 전달하므로,
Compose는 `APP_BASE_PATH`를 브라우저용 정적 파일 주소에만 적용해 빌드합니다.
소스 업데이트 후에도 같은 명령을 사용합니다.

```bash
git pull --ff-only
docker compose up -d --remove-orphans
```

학교 Nginx 설정 예시는 `deployment/nginx.example.conf`에 있습니다. 실제
도메인과 Docker 호스트 주소, 포트는 온프레미스 관리자가 변경해야 합니다.
라즈베리파이 설치와 점검 절차는 `deployment/RASPBERRY_PI.md`에 정리했습니다.

## 배포 전 확인

공용 화면에서 OpenStreetMap 타일 서버(`tile.openstreetmap.org`)로 나가는 HTTPS 연결이 가능해야 지도가 표시됩니다. 학교망이 외부 접속을 차단한다면 오프라인 타일 서버 구성이 별도로 필요합니다.

GitHub Actions는 현재 빌드와 테스트까지만 수행합니다. 학교 서버 자동 배포(CD)는 사용할 이미지 저장소와 서버 접속 방식이 확정된 뒤 추가합니다.
