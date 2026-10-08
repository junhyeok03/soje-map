"use client";

import {
  ArrowDown,
  Check,
  Clock3,
  Compass,
  ExternalLink,
  Flag,
  Footprints,
  Image as ImageIcon,
  Info,
  LocateFixed,
  MapPin,
  MapPinned,
  Maximize2,
  Navigation,
  Route,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  distanceMeters,
  formatDistance,
  googleDirectionsUrl,
  isAccurateEnough,
  kakaoDirectionsUrl,
  resolveArrivalZone,
  withDirectionParticle,
  type LatLng,
} from "./arrival";
import { InteractiveMap } from "./InteractiveMap";
import {
  ERA_LABELS,
  SOJE_LOCATIONS,
  type Era,
} from "./locations";
import { useWalkTracker, type WalkStatus } from "./useWalkTracker";

const ERA_ORDER: Era[] = ["past", "present", "future"];

// 시연 모드 출발점: 전통나래관 서쪽 약 70m (도착 반경 밖)
const SIM_START: LatLng = [36.3349, 127.4366];

const GPS_STATUS_TEXT: Partial<Record<WalkStatus, string>> = {
  locating: "현재 위치를 찾는 중입니다",
  denied: "위치 권한이 거부되었습니다. 시연 모드로 체험해 보세요.",
  unavailable: "위치를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  unsupported: "이 기기는 위치 기능을 지원하지 않습니다.",
};

export function SojeMapExperience() {
  const [activeId, setActiveId] = useState(SOJE_LOCATIONS[0].id);
  const [activeEra, setActiveEra] = useState<Era>("present");
  const [visitedIds, setVisitedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [arrivalId, setArrivalId] = useState<string | null>(null);
  const zoneIdRef = useRef<string | null>(null);
  const visitedRef = useRef<ReadonlySet<string>>(visitedIds);

  const handlePosition = useCallback(
    (position: LatLng, accuracy: number | null) => {
      if (!isAccurateEnough(accuracy)) return;

      const nextZone = resolveArrivalZone(
        zoneIdRef.current,
        position,
        SOJE_LOCATIONS,
      );
      if (nextZone === zoneIdRef.current) return;
      zoneIdRef.current = nextZone;

      if (nextZone && !visitedRef.current.has(nextZone)) {
        const nextVisited = new Set(visitedRef.current).add(nextZone);
        visitedRef.current = nextVisited;
        setVisitedIds(nextVisited);
        setArrivalId(nextZone);
      }
    },
    [],
  );

  const walk = useWalkTracker(SIM_START, handlePosition);

  const resetVisits = useCallback(() => {
    zoneIdRef.current = null;
    visitedRef.current = new Set();
    setVisitedIds(visitedRef.current);
    setArrivalId(null);
  }, []);

  const startWalk = useCallback(
    (mode: "gps" | "sim") => {
      resetVisits();
      if (mode === "gps") walk.startGps();
      else walk.startSim();
    },
    [resetVisits, walk],
  );

  const nextTarget = SOJE_LOCATIONS.find(
    (location) => !visitedIds.has(location.id),
  );
  const nextDistance =
    walk.position && nextTarget
      ? distanceMeters(walk.position, nextTarget.coordinates)
      : null;
  const arrivalLocation = SOJE_LOCATIONS.find(
    (location) => location.id === arrivalId,
  );
  const allVisited = visitedIds.size === SOJE_LOCATIONS.length;
  const lowAccuracy =
    walk.mode === "gps" &&
    walk.status === "tracking" &&
    !isAccurateEnough(walk.accuracy);

  const openArrivalPast = useCallback(() => {
    if (!arrivalId) return;
    setActiveId(arrivalId);
    setActiveEra("past");
    setArrivalId(null);
  }, [arrivalId]);

  const activeLocation = useMemo(
    () =>
      SOJE_LOCATIONS.find((location) => location.id === activeId) ??
      SOJE_LOCATIONS[0],
    [activeId],
  );

  const selectLocation = useCallback((id: string) => {
    setActiveId(id);
    setActiveEra("present");
  }, []);

  const eraContent = activeLocation.eras[activeEra];

  return (
    <main className="experience-shell">
      <header className="site-header">
        <a className="brand" href="#map" aria-label="소제, 시간의 지도 홈">
          <span className="brand-mark" aria-hidden="true">
            <MapPinned size={23} strokeWidth={1.8} />
          </span>
          <span className="brand-copy">
            <strong>소제, 시간의 지도</strong>
            <small>SOJE MEMORY MAP</small>
          </span>
        </a>

        <nav className="header-nav" aria-label="주요 메뉴">
          <a className="nav-link is-active" href="#map">
            지도 탐험
          </a>
          <a className="nav-link" href="#about">
            프로젝트 소개
          </a>
        </nav>

        <div className="header-meta" aria-label="체험 정보">
          <Clock3 size={18} aria-hidden="true" />
          <span>예상 체험 20분</span>
          <span className="live-dot" aria-hidden="true" />
        </div>
      </header>

      <section className="intro-band" id="map" aria-labelledby="map-title">
        <div className="intro-copy">
          <span className="eyebrow">
            <span className="eyebrow-line" />
            1920s — 2035+
          </span>
          <h1 id="map-title">
            골목 위에 겹쳐진
            <br />
            <em>세 개의 시간</em>을 걷다
          </h1>
        </div>
        <div className="intro-note">
          <p>
            지도 위 번호를 선택해 소제동 철도관사촌에 남은 생활의 흔적과
            앞으로의 모습을 만나보세요.
          </p>
          <span className="demo-badge">
            <Info size={15} aria-hidden="true" />
            실제 장소 6곳 · 과거·현재·미래 이미지
          </span>
        </div>
      </section>

      <section className="map-experience" aria-label="소제동 지도 탐험">
        <div className="map-panel">
          <InteractiveMap
            locations={SOJE_LOCATIONS}
            activeId={activeId}
            onSelect={selectLocation}
            visitedIds={visitedIds}
            userPosition={walk.position}
            userAccuracy={walk.mode === "gps" ? walk.accuracy : null}
            userDraggable={walk.mode === "sim"}
            onUserMove={walk.moveTo}
          />

          <div className="map-topbar">
            <div className="route-label">
              <Compass size={18} aria-hidden="true" />
              <span>
                <small>시범 동선</small>
                소제동 기억 산책
              </span>
            </div>
            <div className="route-distance">
              <Route size={18} aria-hidden="true" />
              6개 장소 · 약 16분
            </div>
          </div>

          <div className="walk-panel" aria-label="걸으며 체험하기">
            {walk.mode === "off" ? (
              <>
                <span className="walk-title">
                  <Footprints size={15} aria-hidden="true" />
                  걸으며 체험하기
                </span>
                <div className="walk-actions">
                  <button type="button" onClick={() => startWalk("gps")}>
                    <LocateFixed size={15} aria-hidden="true" />
                    현장 모드
                  </button>
                  <button type="button" onClick={() => startWalk("sim")}>
                    <MapPin size={15} aria-hidden="true" />
                    시연 모드
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="walk-head">
                  <span className="walk-title">
                    {walk.mode === "gps" ? (
                      <LocateFixed size={15} aria-hidden="true" />
                    ) : (
                      <MapPin size={15} aria-hidden="true" />
                    )}
                    {walk.mode === "gps" ? "현장 모드" : "시연 모드"}
                  </span>
                  <span className="walk-progress">
                    방문 {visitedIds.size} / {SOJE_LOCATIONS.length}
                  </span>
                  <button
                    type="button"
                    className="walk-stop"
                    onClick={walk.stop}
                    aria-label="체험 종료"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
                <p className="walk-status" aria-live="polite">
                  {GPS_STATUS_TEXT[walk.status] ??
                    (lowAccuracy
                      ? `위치 정확도가 낮아요 (±${Math.round(walk.accuracy ?? 0)}m). 트인 곳으로 이동해 주세요.`
                      : allVisited
                        ? "6곳을 모두 방문했습니다"
                        : nextTarget && nextDistance !== null
                          ? `다음 장소 ${nextTarget.shortName}까지 약 ${formatDistance(nextDistance)}`
                          : walk.mode === "sim"
                            ? "점을 끌어 옮기거나 아래 버튼을 눌러 보세요"
                            : "")}
                </p>
                {walk.mode === "sim" && nextTarget ? (
                  <button
                    type="button"
                    className="walk-next"
                    onClick={() => walk.walkTo(nextTarget.coordinates)}
                    disabled={walk.walking}
                  >
                    <Footprints size={15} aria-hidden="true" />
                    {walk.walking ? "걷는 중…" : `${withDirectionParticle(nextTarget.shortName)} 걷기`}
                  </button>
                ) : null}
              </>
            )}
          </div>

          {arrivalLocation ? (
            <div
              className="arrival-card"
              role="dialog"
              aria-live="assertive"
              aria-labelledby="arrival-title"
            >
              <button
                type="button"
                className="arrival-close"
                onClick={() => setArrivalId(null)}
                aria-label="도착 안내 닫기"
              >
                <X size={16} aria-hidden="true" />
              </button>
              <span className="arrival-kicker">
                {allVisited ? (
                  <Flag size={14} aria-hidden="true" />
                ) : (
                  <MapPin size={14} aria-hidden="true" />
                )}
                도착 · {String(arrivalLocation.order).padStart(2, "0")}{" "}
                {arrivalLocation.name}
              </span>
              <h3 id="arrival-title">{arrivalLocation.arrival.headline}</h3>
              <p>{arrivalLocation.arrival.message}</p>
              {allVisited ? (
                <p className="arrival-complete">
                  <Check size={14} aria-hidden="true" />
                  소제동 기억 산책 6곳을 모두 걸었습니다.
                </p>
              ) : null}
              <button
                type="button"
                className="arrival-action"
                onClick={openArrivalPast}
              >
                <Clock3 size={15} aria-hidden="true" />
                이 자리의 과거 보기
              </button>
            </div>
          ) : null}

          <div
            className={`map-instruction${walk.mode === "off" ? "" : " is-hidden"}`}
          >
            <span className="instruction-icon" aria-hidden="true">
              <ArrowDown size={18} />
            </span>
            <span>
              <strong>번호를 눌러보세요</strong>
              장소마다 세 개의 시간이 열립니다
            </span>
          </div>

          <div className="location-rail" aria-label="장소 바로 선택">
            {SOJE_LOCATIONS.map((location) => (
              <button
                key={location.id}
                type="button"
                className={`location-chip${
                  location.id === activeId ? " is-active" : ""
                }`}
                onClick={() => selectLocation(location.id)}
                aria-pressed={location.id === activeId}
              >
                <span>
                  {visitedIds.has(location.id) ? (
                    <Check size={13} aria-label="방문함" />
                  ) : (
                    location.order
                  )}
                </span>
                {location.shortName}
              </button>
            ))}
          </div>

          <button
            className="map-expand"
            type="button"
            aria-label="지도 영역에 집중"
            onClick={() =>
              document.querySelector(".map-panel")?.requestFullscreen?.()
            }
          >
            <Maximize2 size={19} aria-hidden="true" />
          </button>
        </div>

        <aside className="story-panel" aria-live="polite">
          <div className="story-heading">
            <div className="place-index">
              <span>{String(activeLocation.order).padStart(2, "0")}</span>
              <i />
              <small>{activeLocation.category}</small>
            </div>
            <h2>{activeLocation.name}</h2>
            <span className="place-address">{activeLocation.address}</span>
            <p>{activeLocation.summary}</p>
          </div>

          <div className="era-tabs" role="tablist" aria-label="시간대 선택">
            {ERA_ORDER.map((era) => (
              <button
                key={era}
                id={`tab-${era}`}
                type="button"
                role="tab"
                aria-selected={activeEra === era}
                aria-controls={`panel-${era}`}
                className={activeEra === era ? "is-active" : ""}
                onClick={() => setActiveEra(era)}
              >
                <span>{ERA_LABELS[era]}</span>
                <small>{activeLocation.eras[era].year}</small>
              </button>
            ))}
          </div>

          <div
            id={`panel-${activeEra}`}
            className={`era-content era-${activeEra}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeEra}`}
          >
            <div className="era-visual">
              {eraContent.photo ? (
                <figure className="era-photo-frame">
                  <div className="era-photo-stage">
                    <Image
                      src={eraContent.photo.src}
                      alt={eraContent.photo.alt}
                      fill
                      sizes="(max-width: 760px) 100vw, 38vw"
                      unoptimized
                    />
                    {eraContent.photo.kind === "ai" ? (
                      <span className={`ai-photo-badge is-${activeEra}`}>
                        <Sparkles size={12} aria-hidden="true" />
                        {activeEra === "past"
                          ? "AI 복원 상상도"
                          : "AI 미래 비전"}
                      </span>
                    ) : null}
                  </div>
                  <figcaption className="photo-caption">
                    <span>
                      {eraContent.photo.capturedAt} · {eraContent.photo.usageNote}
                    </span>
                    {eraContent.photo.sourceUrl ? (
                      <a
                        href={eraContent.photo.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${eraContent.photo.credit} 사진 출처 새 창에서 열기`}
                      >
                        {eraContent.photo.credit}
                        <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="photo-credit">
                        <Sparkles size={12} aria-hidden="true" />
                        {eraContent.photo.credit}
                      </span>
                    )}
                  </figcaption>
                </figure>
              ) : (
                <>
                  <div className="visual-grid" aria-hidden="true" />
                  <div className="visual-silhouette" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="image-placeholder">
                    <ImageIcon size={19} aria-hidden="true" />
                    <span>{eraContent.imageLabel}</span>
                  </div>
                  <div className="visual-era">
                    <small>{ERA_LABELS[activeEra]}</small>
                    <strong>{eraContent.year}</strong>
                  </div>
                </>
              )}
            </div>

            <div className="era-story">
              <span className="story-kicker">
                <Sparkles size={15} aria-hidden="true" />
                이 장소의 시간
              </span>
              <h3>{eraContent.title}</h3>
              <p>{eraContent.description}</p>
            </div>
          </div>

          <div className="direction-links" aria-label="길찾기">
            <span>
              <Navigation size={15} aria-hidden="true" />
              길찾기
            </span>
            <a
              href={kakaoDirectionsUrl(
                activeLocation.name,
                activeLocation.coordinates,
              )}
              target="_blank"
              rel="noreferrer"
            >
              카카오맵
              <ExternalLink size={12} aria-hidden="true" />
            </a>
            <a
              href={googleDirectionsUrl(activeLocation.coordinates)}
              target="_blank"
              rel="noreferrer"
            >
              Google 지도
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>

          <div className="story-footer">
            <span>
              <MapPinned size={17} aria-hidden="true" />
              {activeLocation.walkMinutes === 0
                ? "탐방 시작점"
                : `시작점에서 도보 ${activeLocation.walkMinutes}분`}
            </span>
            <span>
              {activeLocation.order} / {SOJE_LOCATIONS.length}
            </span>
          </div>
        </aside>
      </section>

      <section className="about-strip" id="about" aria-label="프로젝트 소개">
        <div className="about-number">1920</div>
        <div className="about-copy">
          <span className="eyebrow">ABOUT THE PROJECT</span>
          <h2>카페거리를 넘어, 기억을 경험하는 소제동으로</h2>
          <p>
            철도관사촌으로 시작된 소제동의 생활사와 현재의 골목, 미래의
            가능성을 한 화면에서 연결합니다. 별도 앱 설치 없이 누구나 같은
            이야기를 보고 나눌 수 있는 웹 기반 역사 체험입니다.
          </p>
        </div>
        <div className="about-values" aria-label="프로젝트 핵심 가치">
          <span>진정성</span>
          <span>지속성</span>
          <span>공생</span>
        </div>
      </section>

      <footer className="site-footer">
        <span>2026 Smart Human Life Design · D조</span>
        <strong>당신의 시간이 가치가 되는 곳, 소제동</strong>
      </footer>
    </main>
  );
}
