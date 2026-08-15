"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import type { SojeLocation } from "./locations";

type InteractiveMapProps = {
  locations: SojeLocation[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function InteractiveMap({
  locations,
  activeId,
  onSelect,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRefs = useRef(new Map<string, LeafletMarker>());
  const onSelectRef = useRef(onSelect);
  const activeIdRef = useRef(activeId);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

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
      window.setTimeout(() => map.invalidateSize(), 0);
    }

    createMap();

    return () => {
      disposed = true;
      markers.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [locations]);

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
