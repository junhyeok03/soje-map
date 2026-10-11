"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pathLength, pointAlongPath, type LatLng } from "./arrival";

export type WalkMode = "off" | "gps" | "sim";

export type WalkStatus =
  | "idle"
  | "locating"
  | "tracking"
  | "denied"
  | "unavailable"
  | "unsupported";

// 시연용 걷기 애니메이션: 1m당 8ms, 2~5초 사이
function walkDurationMs(meters: number): number {
  return Math.min(Math.max(meters * 8, 2000), 5000);
}

type PositionListener = (position: LatLng, accuracy: number | null) => void;

export function useWalkTracker(simStart: LatLng, onPosition: PositionListener) {
  const [mode, setMode] = useState<WalkMode>("off");
  const [status, setStatus] = useState<WalkStatus>("idle");
  const [position, setPosition] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [walking, setWalking] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const positionRef = useRef<LatLng | null>(null);
  const onPositionRef = useRef(onPosition);

  useEffect(() => {
    onPositionRef.current = onPosition;
  }, [onPosition]);

  const report = useCallback((next: LatLng, nextAccuracy: number | null) => {
    positionRef.current = next;
    setPosition(next);
    setAccuracy(nextAccuracy);
    onPositionRef.current(next, nextAccuracy);
  }, []);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const cancelWalk = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setWalking(false);
  }, []);

  const stop = useCallback(() => {
    clearWatch();
    cancelWalk();
    setMode("off");
    setStatus("idle");
    positionRef.current = null;
    setPosition(null);
    setAccuracy(null);
  }, [cancelWalk, clearWatch]);

  const startGps = useCallback(() => {
    cancelWalk();
    clearWatch();
    setMode("gps");
    positionRef.current = null;
    setPosition(null);
    setAccuracy(null);

    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }

    setStatus("locating");
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        report([coords.latitude, coords.longitude], coords.accuracy);
        setStatus("tracking");
      },
      (error) => {
        setStatus(
          error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
        );
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
  }, [cancelWalk, clearWatch, report]);

  const startSim = useCallback(() => {
    clearWatch();
    cancelWalk();
    setMode("sim");
    setStatus("tracking");
    report(simStart, null);
  }, [cancelWalk, clearWatch, report, simStart]);

  const moveTo = useCallback(
    (next: LatLng) => {
      cancelWalk();
      report(next, null);
    },
    [cancelWalk, report],
  );

  // path[0]은 현재 위치, 마지막 점이 목적지. 길을 따라 일정한 속도로 걷는다.
  const walkAlong = useCallback(
    (path: LatLng[]) => {
      cancelWalk();
      if (path.length === 0) return;
      if (path.length === 1) {
        report(path[0], null);
        return;
      }

      const totalMeters = pathLength(path);
      const startedAt = performance.now();
      const duration = walkDurationMs(totalMeters);
      setWalking(true);

      const step = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        report(pointAlongPath(path, totalMeters * progress), null);
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(step);
        } else {
          frameRef.current = null;
          setWalking(false);
        }
      };

      frameRef.current = requestAnimationFrame(step);
    },
    [cancelWalk, report],
  );

  useEffect(
    () => () => {
      clearWatch();
      cancelWalk();
    },
    [cancelWalk, clearWatch],
  );

  return {
    mode,
    status,
    position,
    accuracy,
    walking,
    startGps,
    startSim,
    stop,
    moveTo,
    walkAlong,
  };
}
