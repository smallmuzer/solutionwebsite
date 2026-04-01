import { useState, useEffect, useRef } from "react";
import AnimatedSection from "./AnimatedSection";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Users, Building2, Map, X } from "lucide-react";
import { supabase } from "@/lib/localClient";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const createCustomIcon = (isActive: boolean) =>
  L.divIcon({
    className: "custom-map-marker",
    html: `<div style="
      width:${isActive ? 20 : 14}px; height:${isActive ? 20 : 14}px;
      background:hsl(217,91%,60%); border:3px solid white; border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.3),0 0 20px rgba(59,130,246,0.4);
    "></div>`,
    iconSize:   [isActive ? 20 : 14, isActive ? 20 : 14],
    iconAnchor: [isActive ? 10 : 7,  isActive ? 10 : 7],
  });

interface LocationData {
  name: string; lat: number; lng: number;
  clients: string; description: string; flag: string; landmark: string;
}

// Default locations — always shown
const DEFAULT_LOCATIONS: LocationData[] = [
  { name: "Malé, Maldives",     lat: 4.1755,   lng: 73.5093,  clients: "HQ — 40+ clients",  description: "Our headquarters serving government and private sector clients across the Maldives.", flag: "🇲🇻", landmark: "🏝️ Overwater Villas" },
  { name: "Thimphu, Bhutan",    lat: 27.4728,  lng: 89.6393,  clients: "RCSC Bhutan",        description: "Supporting the Royal Civil Service Commission with digital transformation.",           flag: "🇧🇹", landmark: "🏯 Tiger's Nest"     },
  { name: "Tamilnadu, India",   lat: 9.9195,   lng: 78.1193,  clients: "Regional Support",   description: "Our hub for technology development and regional support in Southern India.",            flag: "🇮🇳", landmark: "🏛️ Madurai Meenatchi Amman Temple" },
];

const CLIENT_LOCATION_MAP: Record<string, Omit<LocationData, "clients">> = {
  "RCSC Bhutan":   { name: "Thimphu, Bhutan",    lat: 27.4728, lng: 89.6393,  description: "RCSC Bhutan digital transformation project.", flag: "🇧🇹", landmark: "🏯 Tiger's Nest" },
  "Flyme":         { name: "Malé, Maldives",      lat: 4.1755,  lng: 73.5093,  description: "Flyme airline digital solutions.",            flag: "🇲🇻", landmark: "✈️ Velana Airport" },
  "Medianet":      { name: "Malé, Maldives",      lat: 4.1755,  lng: 73.5093,  description: "Medianet telecom solutions.",                 flag: "🇲🇻", landmark: "📡 Telecom Hub" },
};

function InvalidateSize() {
  const map = useMap();
  useEffect(() => { const t = setTimeout(() => map.invalidateSize(), 300); return () => clearTimeout(t); }, [map]);
  return null;
}

function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 8, { duration: 1.5 }); }, [lat, lng, map]);
  return null;
}

const WorldMap = () => {
  const [activeLocation, setActiveLocation] = useState<LocationData | null>(null);
  const [locations,      setLocations]      = useState<LocationData[]>(DEFAULT_LOCATIONS);
  const [showMap,        setShowMap]        = useState(false);
  const [mapMounted,     setMapMounted]     = useState(false);
  const [detailVisible,  setDetailVisible]  = useState(false);
  const [header, setHeader] = useState({ badge: "Global Presence", title: "Our", highlight: "Reach", description: "Serving clients across Maldives, Bhutan, and beyond." });
  const detailTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const load = async () => {
      const [presenceRes, headerRes, clientsRes] = await Promise.all([
        supabase.from("site_content").select("content").eq("section_key", "global_presence").maybeSingle(),
        supabase.from("site_content").select("content").eq("section_key", "global_presence_header").maybeSingle(),
        supabase.from("client_logos").select("name").eq("is_visible", true),
      ]);
      let locs: LocationData[] = [...DEFAULT_LOCATIONS];
      if (presenceRes.data?.content) {
        const c = presenceRes.data.content as any;
        if (Array.isArray(c.locations) && c.locations.length > 0) locs = c.locations;
      }
      if (clientsRes.data) {
        for (const cl of clientsRes.data) {
          const mapped = CLIENT_LOCATION_MAP[cl.name];
          if (mapped && !locs.some(l => l.name === mapped.name)) {
            locs.push({ ...mapped, clients: cl.name });
          }
        }
      }
      setLocations(locs);
      if (headerRes.data?.content) {
        const c = headerRes.data.content as any;
        setHeader(h => ({ ...h, ...c }));
      }
    };
    load();
    const ch = supabase.channel("global_presence_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_content" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_logos" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleLocationClick = (loc: LocationData) => {
    if (activeLocation?.name === loc.name && showMap) {
      setShowMap(false);
      setTimeout(() => { setMapMounted(false); setActiveLocation(null); }, 400);
      return;
    }
    setActiveLocation(loc);
    clearTimeout(detailTimer.current);
    setDetailVisible(false);
    detailTimer.current = setTimeout(() => setDetailVisible(true), 20);
    if (!showMap) {
      setMapMounted(true);
      setTimeout(() => setShowMap(true), 10);
    }
  };

  const clearDetail = () => {
    setDetailVisible(false);
    setTimeout(() => setActiveLocation(null), 250);
  };

  const uniqueLocations = locations.filter((loc, idx, arr) => arr.findIndex(l => l.name === loc.name) === idx);

  return (
    <section className="section-padding overflow-hidden" id="global-reach">
      <div className="container-wide">
        <AnimatedSection className="text-center mb-10">
          <span className="text-secondary font-semibold text-sm uppercase tracking-widest">{header.badge}</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mt-3 mb-4">
            {header.title} <span className="gradient-text">{header.highlight}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-[0.9375rem]">{header.description}</p>
        </AnimatedSection>

        <AnimatedSection>
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-center gap-5 lg:gap-6">
              {uniqueLocations.slice(0, 3).map((loc) => {
                const isActive = activeLocation?.name === loc.name;
                return (
                  <div
                    key={loc.name}
                    onClick={() => handleLocationClick(loc)}
                    className="group p-5 rounded-2xl text-left cursor-pointer border relative overflow-hidden transition-all duration-300 hover:shadow-xl w-full sm:w-[calc(50%-1.25rem)] lg:w-[30%] max-w-sm flex flex-col"
                    style={{
                      border: isActive ? "1.5px solid hsl(var(--secondary)/0.7)" : "1px solid hsl(var(--border)/0.5)",
                      background: isActive
                        ? "linear-gradient(135deg, hsl(var(--secondary)/0.18), hsl(var(--secondary)/0.06))"
                        : "linear-gradient(135deg, hsl(var(--card)/0.90), hsl(var(--card)/0.60))",
                      backdropFilter: "blur(20px)",
                      transform: isActive ? "scale(1.04)" : "scale(1)",
                      boxShadow: isActive ? "0 8px 25px hsl(var(--secondary)/0.15)" : "0 4px 12px rgba(0,0,0,0.03)",
                      minHeight: 120,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl drop-shadow-sm">{loc.flag}</span>
                        <span className="font-heading font-bold text-foreground text-[1rem] leading-tight flex-1">
                          {loc.name.split(",")[0]}
                        </span>
                      </div>
                      <button 
                        className={`shrink-0 p-2 rounded-full transition-all duration-300 shadow-sm ${isActive ? "bg-secondary text-white scale-110" : "bg-secondary/70 text-white hover:bg-secondary hover:scale-110"}`}
                        title="View on map"
                        onClick={(e) => { e.stopPropagation(); handleLocationClick(loc); }}
                      >
                        <MapPin size={16} />
                      </button>
                    </div>
                    <div className="text-muted-foreground text-[0.8125rem] leading-relaxed line-clamp-2 mb-2 flex-1">{loc.clients}</div>
                    <div className="text-[0.6875rem] text-secondary/90 font-semibold flex items-center gap-1.5 mt-auto pt-2 border-t border-border/40">
                      <Building2 size={12} /> {loc.landmark}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active location detail — Moved above the map */}
            {activeLocation && (
              <div
                className="mt-6 mb-6 rounded-xl p-4 border border-border/40 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--card)/0.85), hsl(var(--card)/0.55))",
                  backdropFilter: "blur(20px)",
                  opacity: detailVisible ? 1 : 0,
                  transform: detailVisible ? "translateY(0)" : "translateY(10px)",
                  transition: "opacity 0.25s ease, transform 0.25s ease",
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{activeLocation.flag}</div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-foreground text-[0.9375rem] flex items-center gap-2">
                      <MapPin size={14} className="text-secondary" />
                      {activeLocation.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users size={12} /> {activeLocation.clients}</span>
                      <span className="flex items-center gap-1"><Building2 size={12} /> Active Operations</span>
                      <span className="text-secondary/70">{activeLocation.landmark}</span>
                    </div>
                    <p className="text-muted-foreground text-[0.8125rem] mt-2 leading-relaxed">{activeLocation.description}</p>
                  </div>
                  <button onClick={clearDetail} className="text-muted-foreground hover:text-foreground shrink-0">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Map */}
            {mapMounted && (
              <div
                className="rounded-xl overflow-hidden border border-border shadow-lg relative"
                style={{
                  maxHeight: showMap ? 340 : 0,
                  opacity: showMap ? 1 : 0,
                  transition: "max-height 0.4s ease, opacity 0.35s ease",
                }}
              >
                {showMap && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearTimeout(detailTimer.current);
                      setDetailVisible(false);
                      setShowMap(false);
                      setTimeout(() => setActiveLocation(null), 350);
                    }}
                    className="absolute top-3 right-3 z-[1000] p-2 bg-background/80 backdrop-blur border border-border hover:bg-muted text-foreground rounded-full shadow-md transition-colors"
                    title="Close Map"
                  >
                    <X size={16} />
                  </button>
                )}
                <MapContainer
                  center={activeLocation ? [activeLocation.lat, activeLocation.lng] : [15, 70]}
                  zoom={activeLocation ? 7 : 3}
                  minZoom={2} maxZoom={18}
                  scrollWheelZoom={true}
                  style={{ height: "340px", width: "100%" }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <InvalidateSize />
                  {activeLocation && <FlyToLocation lat={activeLocation.lat} lng={activeLocation.lng} />}
                  {uniqueLocations.map((loc) => (
                    <Marker
                      key={loc.name}
                      position={[loc.lat, loc.lng]}
                      icon={createCustomIcon(activeLocation?.name === loc.name)}
                      eventHandlers={{ click: () => handleLocationClick(loc) }}
                    >
                      <Popup>
                        <div className="text-sm font-semibold">{loc.flag} {loc.name}</div>
                        <div className="text-xs opacity-70">{loc.clients}</div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default WorldMap;
