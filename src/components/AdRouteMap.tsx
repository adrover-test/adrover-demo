import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type RouteCab = {
  vehicle: string;
  area: string;
  seed: number;
  location: string;
  time: string;
};

const areaCenters: Record<string, [number, number]> = {
  "hitec city": [17.4435, 78.3772],
  gachibowli: [17.4401, 78.3489],
  "jubilee hills": [17.4326, 78.4071],
  "banjara hills": [17.4156, 78.4347],
  madhapur: [17.4486, 78.3908],
  "financial district": [17.4172, 78.3419],
  secunderabad: [17.4399, 78.4983],
  "airport express corridor": [17.33, 78.43],
  kukatpally: [17.4948, 78.3996],
  miyapur: [17.4969, 78.3548],
};
const hyderabad: [number, number] = [17.385, 78.4867];

function centerFor(area: string): [number, number] {
  return areaCenters[area.trim().toLowerCase()] ?? hyderabad;
}

function random(seed: number) {
  let state = (seed * 9301 + 49297) % 233280;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

export function buildRoute(cab: RouteCab): [number, number][] {
  const next = random(cab.seed);
  const [lat, lng] = centerFor(cab.area);
  let currentLat = lat + (next() - 0.5) * 0.03;
  let currentLng = lng + (next() - 0.5) * 0.03;
  let heading = next() * Math.PI * 2;
  const points: [number, number][] = [[currentLat, currentLng]];
  for (let step = 0; step < 9; step += 1) {
    heading += (next() - 0.5) * 1.1;
    currentLat += Math.sin(heading) * 0.0045;
    currentLng += Math.cos(heading) * 0.0045;
    points.push([currentLat, currentLng]);
  }
  return points;
}

export function AdRouteMap({
  cabs,
  selected,
  onSelect,
}: {
  cabs: RouteCab[];
  selected?: string;
  onSelect: (vehicle: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(instance);
    layer.current = L.layerGroup().addTo(instance);
    map.current = instance;
    instance.setView(hyderabad, 11);
    return () => {
      instance.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);

  useEffect(() => {
    const group = layer.current;
    const instance = map.current;
    if (!group || !instance) return;
    group.clearLayers();
    const bounds: [number, number][] = [];
    cabs.forEach((cab) => {
      const route = buildRoute(cab);
      bounds.push(...route);
      const active = cab.vehicle === selected;
      L.polyline(route, {
        color: active ? "#0b57d0" : "#4285f4",
        weight: active ? 7 : 4,
        opacity: active ? 1 : 0.75,
        lineCap: "round",
      })
        .on("click", () => onSelect(cab.vehicle))
        .addTo(group);
      L.circleMarker(route[route.length - 1], {
        radius: active ? 9 : 6,
        color: "#fff",
        weight: 2,
        fillColor: active ? "#d93025" : "#087a45",
        fillOpacity: 1,
      })
        .bindTooltip(`${cab.vehicle} · ${cab.location} · ${cab.time}`)
        .on("click", () => onSelect(cab.vehicle))
        .addTo(group);
    });
    if (bounds.length) instance.fitBounds(bounds, { padding: [24, 24] });
  }, [cabs, selected, onSelect]);

  return <div className="ad-route-map" ref={container} />;
}
