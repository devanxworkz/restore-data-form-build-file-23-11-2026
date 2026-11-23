import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMap,
  Circle
} from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Fix Leaflet marker icons */
const vehicleIcon = new L.Icon({
  iconUrl:
    "https://image2url.com/r2/bucket1/images/1766578509361-ef3335af-97c7-4ad0-8751-85d2c3620c1e.png",
  iconSize: [55,45],     // width = height
  iconAnchor: [32, 32],   // popup position
});


const INDIA_BOUNDS = [
  [6.4627, 68.1097],   // Southwest corner
  [35.5133, 97.3954]   // Northeast corner
];

/* Parse "lat,lng" (string) or [lat, lng] (array) into numbers. */
const parseLatLong = (value) => {
  if (Array.isArray(value) && value.length === 2) {
    const lat = Number(value[0]);
    const lng = Number(value[1]);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  if (typeof value === "string") {
    const [a, b] = value.split(",").map((n) => parseFloat(n.trim()));
    return Number.isFinite(a) && Number.isFinite(b) ? { lat: a, lng: b } : null;
  }
  return null;
};

/* `owner` may arrive as a JSON string, e.g. {"owner":",Anand Reddy"}. */
const extractOwnerName = (raw) => {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  if (!str) return null;
  if (str.startsWith("{")) {
    try {
      const obj = JSON.parse(str);
      return String(obj.owner || "").replace(/^,/, "").trim() || null;
    } catch {
      /* not JSON – fall through */
    }
  }
  return str.replace(/^,/, "").trim() || null;
};

/* Phone is not provided by /live/all yet. Read every likely key so the value
   appears automatically once the backend starts sending it. */
const pickPhone = (item, existing) =>
  item?.phone ??
  item?.phonenumber ??
  item?.phone_number ??
  existing?.phonenumber ??
  null;


/* ================= MAP SEARCH CONTROLLER ================= */
function SearchController({ place, setBoundary, setFallbackCircle }) {
  const map = useMap();

  useEffect(() => {
    if (!place || !map) return;

    const lat = Number(place.lat);
    const lon = Number(place.lon);

    try {
      // ✅ If polygon exists
      if (
        place.geojson &&
        (place.geojson.type === "Polygon" ||
          place.geojson.type === "MultiPolygon")
      ) {
        setFallbackCircle(null);
        setBoundary(place.geojson);

        const geoLayer = L.geoJSON(place.geojson);
        const bounds = geoLayer.getBounds();

        if (bounds.isValid()) {
          map.flyToBounds(bounds, {
            padding: [20, 20],
            duration: 1.2
          });
        }
      } else {
        // ✅ Fallback circle
        setBoundary(null);

        const circle = L.circle([lat, lon], { radius: 15000 });
        const bounds = circle.getBounds();

        if (bounds.isValid()) {
          map.flyToBounds(bounds, {
            padding: [20, 20],
            duration: 1.2
          });
        }

        setFallbackCircle({
          center: [lat, lon],
          radius: 15000
        });
      }
    } catch (err) {
      console.error("Map zoom error:", err);

      // emergency fallback
      map.setView([lat, lon], 10);
    }
  }, [place, map, setBoundary, setFallbackCircle]);

  return null;
}

/* Keep Leaflet in sync when the map container height changes. */
function MapResize({ containerHeight }) {
  const map = useMap();

  useEffect(() => {
    const id = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(id);
  }, [containerHeight, map]);

  return null;
}

/* ================= MAIN ================= */
export default function Mapinvehical({ onVehicleSelect }) {
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const containerRef = useRef(null);

  const [vehicles, setVehicles] = useState({});
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [boundary, setBoundary] = useState(null);
  const [fallbackCircle, setFallbackCircle] = useState(null);
  const [containerHeight, setContainerHeight] = useState(null);
  const searchTimeout = useRef(null);
  /* -------- SEARCH -------- */
const fetchPlaces = async (text) => {
  if (text.length < 3) {
    setSuggestions([]);
    return;
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `format=json&addressdetails=1&` +
      `q=${encodeURIComponent(text)}&countrycodes=in&limit=5`
    );

    const data = await res.json();
    setSuggestions(data);
  } catch (err) {
    console.error(err);
    setSuggestions([]);
  }
};



const selectPlace = async (place) => {
  setQuery(place.display_name);
  setSuggestions([]);
  setHighlightIndex(-1);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `format=json&polygon_geojson=1&addressdetails=1&` +
      `q=${encodeURIComponent(place.display_name)}&countrycodes=in&limit=1`
    );

    const data = await res.json();

    if (data.length && data[0].geojson) {
      setSelectedPlace(data[0]);
    } else {
      setSelectedPlace(place);
    }
  } catch {
    setSelectedPlace(place);
  }
};


  const handleKeyDown = (e) => {
    if (!suggestions.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      selectPlace(
        highlightIndex >= 0 ? suggestions[highlightIndex] : suggestions[0]
      );
    }
  };

  

  useEffect(() => {
    let ws;
    let timer;
    let disposed = false;

    const connect = () => {
      if (
        ws &&
        (ws.readyState === WebSocket.OPEN ||
          ws.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      ws = new WebSocket("wss://cc.rivotmotors.com/live/all");
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) ws.close();
      };

      ws.onmessage = (e) => {
        if (disposed) return;

        let msg;
        try {
          msg = JSON.parse(e.data);
        } catch {
          return;
        }
        if (!msg) return;

        /* Full snapshot of every known vehicle. */
        if (msg.type === "vehicles_state" && Array.isArray(msg.data)) {
          setVehicles((prev) => {
            const next = { ...prev };
            msg.data.forEach((item) => {
              const vin = String(item.vin || "").trim();
              if (!vin) return;
              const pos = parseLatLong(item.lat_long);
              if (!pos) return;
              const existing = next[vin];
              next[vin] = {
                ...(existing || {}),
                vinnumber: vin,
                ownername:
                  extractOwnerName(item.owner_name) ||
                  extractOwnerName(item.owner) ||
                  existing?.ownername ||
                  "Unknown",
                phonenumber: pickPhone(item, existing),
                lat: pos.lat,
                lng: pos.lng,
              };
            });
            return next;
          });
          return;
        }

        /* Incremental update for a single vehicle. */
        if (msg.type === "vehicle_state") {
          const vin = String(msg.vin || "").trim();
          if (!vin) return;
          const d = msg.data || {};
          const pos = parseLatLong(d.lat_long ?? msg.lat_long);

          setVehicles((prev) => {
            const existing = prev[vin];
            if (!existing && !pos) return prev;
            return {
              ...prev,
              [vin]: {
                ...(existing || { vinnumber: vin, ownername: "Unknown" }),
                ...(pos ? { lat: pos.lat, lng: pos.lng } : {}),
                ownername:
                  extractOwnerName(d.owner_name) ||
                  extractOwnerName(msg.owner_name) ||
                  existing?.ownername ||
                  "Unknown",
                phonenumber: pickPhone({ ...msg, ...d }, existing),
              },
            };
          });
        }
      };

      ws.onerror = () => ws.close();

      ws.onclose = () => {
        if (!disposed) timer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      disposed = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, []);


  const clearSearch = () => {
  setQuery("");
  setSuggestions([]);
  setHighlightIndex(-1);
  setSelectedPlace(null);
  setBoundary(null);
  setFallbackCircle(null);
};

  /* Measure the space left inside <main> after the header/search bar so the map
     fills exactly one screen without hardcoding the header or sidebar size. */
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let frame = 0;

    const measure = () => {
      const parent = el.parentElement;
      const parentStyle = parent ? window.getComputedStyle(parent) : null;
      const parentPaddingBottom = parentStyle
        ? parseFloat(parentStyle.paddingBottom) || 0
        : 0;

      const available =
        window.innerHeight - el.getBoundingClientRect().top - parentPaddingBottom;
      const next = Math.max(320, Math.floor(available));

      setContainerHeight((prev) => (prev === next ? prev : next));
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(measure);
      });
    };

    scheduleMeasure();
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("orientationchange", scheduleMeasure);

    let observer;
    if (typeof ResizeObserver !== "undefined" && el.parentElement) {
      observer = new ResizeObserver(scheduleMeasure);
      observer.observe(el.parentElement);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("orientationchange", scheduleMeasure);
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight ? `${containerHeight}px` : "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
           background: "#0b0b0b",
      padding: 12,
      position: "relative",
    zIndex: 20,
    zIndex: 10000,
    flexShrink: 0,
          }}
      >

  <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>
  <div style={{ display: "flex", position: "relative" }}>
  <input
    value={query}
   onChange={(e) => {
  const value = e.target.value;
  setQuery(value);

  if (searchTimeout.current) {
    clearTimeout(searchTimeout.current);
  }

  searchTimeout.current = setTimeout(() => {
    fetchPlaces(value);
  }, 400);
}}


    onKeyDown={handleKeyDown}
    placeholder="Search city / district"
    style={{
      flex: 1,
      padding: "10px 40px 10px 16px", 
      borderRadius: "20px 0 0 20px",
      border: "1px solid #444",
      background: "#111",
      color: "#fff",
      outline: "none"
    }}
  />

  {query && (
    <button
      onClick={clearSearch}
      style={{
        position: "absolute",
        right: 60,
        top: "50%",
        transform: "translateY(-50%)",
        background: "transparent",
        border: "none",
        color: "#aaa",
        cursor: "pointer",
        fontSize: 16
      }}
      title="Clear"
    >
      ✕
    </button>
  )}

  <button
    onClick={() => {
      if (suggestions.length) selectPlace(suggestions[0]);
    }}
    style={{
      width: 50,
      borderRadius: "0 20px 20px 0",
      border: "1px solid #444",
      background: "#1e1e1e",
      color: "#fff",
      cursor: "pointer",
      paddingLeft:"15px"
    }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
</svg>
  </button>
</div>
          {/* 🔽 DROPDOWN FLOATS OVER MAP */}
          {suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 54,
                left: 0,
                width: "100%",
                background: "#111",
                borderRadius: 12,
                maxHeight: 280,
                overflowY: "auto",
                zIndex: 9999,
                boxShadow: "0 10px 30px rgba(0,0,0,0.7)"
              }}
            >
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => selectPlace(s)}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    background:
                      i === highlightIndex ? "#2a2a2a" : "transparent",
                    color: "#ddd"
                  }}
                >
                  {s.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <MapContainer
          center={[22.9734, 78.6569]}
          zoom={5}
          minZoom={4}
          maxBounds={INDIA_BOUNDS}
          maxBoundsViscosity={1}
          
          style={{ height: "100%", width: "100%" }}

        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <MapResize containerHeight={containerHeight} />

          <SearchController
            place={selectedPlace}
            setBoundary={setBoundary}
            setFallbackCircle={setFallbackCircle}
          />

          {boundary && boundary.type !== "Point" && (
          <GeoJSON
            key={JSON.stringify(boundary)}
            data={boundary}
            style={{
              color: "#ff9800",
              weight: 3,
              fillOpacity: 0.08
            }}
          />
        )}
            {fallbackCircle && (
            <Circle
              center={fallbackCircle.center}
              radius={fallbackCircle.radius}
              pathOptions={{ color: "#ff9800", fillOpacity: 0.05 }}
            />
          )}

        {Object.values(vehicles).map(v => (
      <Marker
        key={v.vinnumber}
        position={[v.lat, v.lng]}
        icon={vehicleIcon}
        eventHandlers={{
          mouseover: (e) => {
            e.target.openPopup();
          },
          mouseout: (e) => {
            e.target.closePopup();
          },
          click: () => {
      onVehicleSelect(v.vinnumber);
    }
        }}
      >
    <Popup
  closeButton={false}
  className="custom-popup"
>
  <div className="popup-card">
    <div className="popup-header">
      {v.ownername}
    </div>

    <div className="popup-body">
      <div><span>VIN:</span> {v.vinnumber}</div>
      {v.phonenumber ? (
        <div><span>Phone:</span> {v.phonenumber}</div>
      ) : null}
    </div>
  </div>
</Popup>

  </Marker>
))}
        </MapContainer>
      </div>
    </div>
  );
}
