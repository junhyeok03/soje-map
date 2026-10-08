"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Circle as LeafletCircle,
  Map as LeafletMap,
  Marker as LeafletMarker,
  Polyline as LeafletPolyline,
} from "leaflet";
import { distanceMeters, type LatLng } from "./arrival";
import type { SojeLocation } from "./locations";

type LeafletModule = typeof import("leaflet");

type InteractiveMapProps = {
  locations: SojeLocation[];
  activeId: string;
  onSelect: (id: string) => void;
  visitedIds: ReadonlySet<string>;
  userPosition: LatLng | null;
  userAccuracy: number | null;
  userDraggable: boolean;
  onUserMove: (position: LatLng) => void;
  guideTarget: LatLng | null;
  startPoint: { name: string; coordinates: LatLng } | null;
};

// 이 거리 안에 있을 때만 내 위치가 보이도록 지도 범위를 넓힌다 (멀리서 켠 GPS 제외)
const FIT_USER_WITHIN_METERS = 2000;

export function InteractiveMap({
  locations,
  activeId,
  onSelect,
  visitedIds,
  userPosition,
  userAccuracy,
  userDraggable,
  onUserMove,
  guideTarget,
  startPoint,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const markerRefs = useRef(new Map<string, LeafletMarker>());
  const userMarkerRef = useRef<LeafletMarker | null>(null);
  const accuracyCircleRef = useRef<LeafletCircle | null>(null);
  const guideLineRef = useRef<LeafletPolyline | null>(null);
  const startMarkerRef = useRef<LeafletMarker | null>(null);
  const onSelectRef = useRef(onSelect);
  const onUserMoveRef = useRef(onUserMove);
  const activeIdRef = useRef(activeId);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onUserMoveRef.current = onUserMove;
  }, [onUserMove]);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let disposed = false;
    const markers = markerRefs.current;

    async function createMap() {
      const L = await import("leaflet");
      if (disposed || !containerRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        center: [36.33655, 127.43705],
        zoom: 17,
        minZoom: 14,
        maxZoom: 19,
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.polyline(
        locations.map((location) => location.coordinates),
        {
          color: "#6a2d12",
          weight: 3,
          opacity: 0.52,
          dashArray: "5 10",
          lineCap: "round",
        },
      ).addTo(map);

      locations.forEach((location) => {
        const icon = L.divIcon({
          className: `memory-marker${location.id === activeIdRef.current ? " is-active" : ""}`,
          html: `<span class="marker-number"><b>${location.order}</b></span><span class="marker-pulse"></span>`,
          iconSize: [48, 58],
          iconAnchor: [24, 54],
          tooltipAnchor: [0, -48],
        });

        const marker = L.marker(location.coordinates, {
          icon,
          title: `${location.order}. ${location.name}`,
          riseOnHover: true,
          keyboard: true,
        })
          .addTo(map)
          .bindTooltip(location.shortName, {
            direction: "top",
            offset: [0, -8],
            opacity: 1,
            className: "memory-tooltip",
          });

        marker.on("click", () => onSelectRef.current(location.id));
        markers.set(location.id, marker);
      });

      map.fitBounds(
        L.latLngBounds(locations.map((location) => location.coordinates)),
        { padding: [72, 72], maxZoom: 17 },
      );

      mapRef.current = map;
      setMapReady(true);
      window.setTimeout(() => map.invalidateSize(), 0);
    }

    createMap();

    return () => {
      disposed = true;
      markers.clear();
      userMarkerRef.current = null;
      accuracyCircleRef.current = null;
      guideLineRef.current = null;
      startMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [locations]);

  useEffect(() => {
    markerRefs.current.forEach((marker, id) => {
      marker.getElement()?.classList.toggle("is-visited", visitedIds.has(id));
    });
  }, [visitedIds, mapReady]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;

    if (!userPosition) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      accuracyCircleRef.current?.remove();
      accuracyCircleRef.current = null;
      return;
    }

    if (!userMarkerRef.current) {
      const marker = L.marker(userPosition, {
        icon: L.divIcon({
          className: "user-marker",
          html: '<span class="user-dot"></span>',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
        title: "내 위치",
        zIndexOffset: 1000,
        keyboard: false,
      }).addTo(map);
      marker.on("drag", () => {
        const { lat, lng } = marker.getLatLng();
        onUserMoveRef.current([lat, lng]);
      });
      userMarkerRef.current = marker;

      const nearest = Math.min(
        ...locations.map((location) =>
          distanceMeters(userPosition, location.coordinates),
        ),
      );
      if (
        nearest <= FIT_USER_WITHIN_METERS &&
        !map.getBounds().pad(-0.15).contains(userPosition)
      ) {
        map.fitBounds(
          L.latLngBounds(locations.map((location) => location.coordinates)).extend(
            userPosition,
          ),
          {
            paddingTopLeft: [40, 190],
            paddingBottomRight: [40, 90],
            maxZoom: 17,
          },
        );
      }
    } else {
      userMarkerRef.current.setLatLng(userPosition);
    }

    if (userAccuracy !== null) {
      if (!accuracyCircleRef.current) {
        accuracyCircleRef.current = L.circle(userPosition, {
          radius: userAccuracy,
          color: "#798194",
          weight: 1,
          fillOpacity: 0.12,
          interactive: false,
        }).addTo(map);
      } else {
        accuracyCircleRef.current
          .setLatLng(userPosition)
          .setRadius(userAccuracy);
      }
    } else {
      accuracyCircleRef.current?.remove();
      accuracyCircleRef.current = null;
    }
  }, [mapReady, userPosition, userAccuracy, locations]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;

    if (!userPosition || !guideTarget) {
      guideLineRef.current?.remove();
      guideLineRef.current = null;
      return;
    }

    const points: LatLng[] = [userPosition, guideTarget];
    if (!guideLineRef.current) {
      guideLineRef.current = L.polyline(points, {
        className: "guide-line",
        color: "#798194",
        weight: 3,
        opacity: 0.9,
        dashArray: "2 8",
        lineCap: "round",
        interactive: false,
      }).addTo(map);
    } else {
      guideLineRef.current.setLatLngs(points);
    }
  }, [mapReady, userPosition, guideTarget]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;

    startMarkerRef.current?.remove();
    startMarkerRef.current = null;
    if (!startPoint) return;

    startMarkerRef.current = L.marker(startPoint.coordinates, {
      icon: L.divIcon({
        className: "start-marker",
        html: `<span>${startPoint.name}</span>`,
        iconSize: [56, 24],
        iconAnchor: [28, 34],
      }),
      interactive: false,
      keyboard: false,
    }).addTo(map);
  }, [mapReady, startPoint]);

  useEffect(() => {
    const marker = userMarkerRef.current;
    if (!marker?.dragging) return;
    if (userDraggable) marker.dragging.enable();
    else marker.dragging.disable();
    marker.getElement()?.classList.toggle("is-draggable", userDraggable);
  }, [userDraggable, userPosition, mapReady]);

  useEffect(() => {
    markerRefs.current.forEach((marker, id) => {
      marker.getElement()?.classList.toggle("is-active", id === activeId);
    });

    const activeLocation = locations.find((location) => location.id === activeId);
    if (activeLocation && mapRef.current) {
      mapRef.current.flyTo(activeLocation.coordinates, 17, { duration: 0.75 });
    }
  }, [activeId, locations]);

  return (
    <div
      ref={containerRef}
      className="leaflet-stage"
      role="application"
      aria-label="소제동 역사 장소 인터랙티브 지도"
    />
  );
}
