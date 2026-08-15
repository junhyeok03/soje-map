# Raspberry Pi 5 배포

## 전제 조건

- Ubuntu Server 64-bit (`uname -m` 결과가 `aarch64` 또는 `arm64`)
- Docker Engine
- Docker Compose 플러그인 (`docker compose version` 명령이 동작해야 함)
- 지도 표시를 위한 `https://tile.openstreetmap.org` 외부 HTTPS 접속

프론트엔드와 백엔드의 기반 이미지는 ARM64를 지원하는 공식 Node.js,
Maven, Eclipse Temurin 멀티아키텍처 이미지입니다.

## 최초 배포

```bash
git clone <GITHUB_REPOSITORY_URL> soje-map
cd soje-map
docker compose up -d
```

라즈베리파이에서 직접 확인하는 주소는 `http://서버IP:18080/`입니다. 기본
공개 주소는 학교 Nginx를 거친 `https://daisy.wisoft.dev/junhyeok/pj`입니다.
관리자가 다른 공개 경로 또는 포트를 지정한 경우에만 다음과 같이 `.env`를
만든 뒤 기동합니다.

```bash
cp .env.example .env
nano .env
docker compose up -d
```

## 정상 동작 확인

```bash
docker compose ps
curl -fsS http://127.0.0.1:18080/ > /dev/null && echo "frontend: OK"
curl -fsS http://127.0.0.1:18081/actuator/health
```

`docker compose ps`에서 두 서비스가 모두 `healthy`여야 합니다. 백엔드 상태
확인 응답에는 `{"status":"UP"}`가 포함됩니다.

로그 확인 명령은 다음과 같습니다.

```bash
docker compose logs --tail=100 frontend backend
```

## 이후 업데이트

Compose의 `pull_policy: build` 설정으로 기동할 때 로컬 이미지를 다시 확인하고
빌드합니다. 따라서 소스를 내려받은 뒤에도 최초 배포와 같은 명령을 사용합니다.

```bash
git pull --ff-only
docker compose up -d --remove-orphans
docker image prune -f
```

## 운영 명령

```bash
# 재시작
docker compose restart

# 중지 및 컨테이너 제거 (이미지와 소스는 유지)
docker compose down

# 현재 상태
docker compose ps
```

학교 Nginx는 `/junhyeok/pj` 접두사를 제거하고 나머지 경로를 라즈베리파이의
`18080` 포트로 전달합니다. 예를 들어 공개 주소의
`/junhyeok/pj/_next/static/...`은 컨테이너의 `/_next/static/...`으로 전달되어야
합니다. Spring API를 실제로 사용하기 전까지 외부에는 백엔드 `18081` 포트를
개방할 필요가 없습니다.
