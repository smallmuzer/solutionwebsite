import { useEffect, useState } from "react";
import { supabase } from "@/lib/localClient";

const DEFAULT_CONTENT: Record<string, Record<string, string>> = {
  hero: {
    title: "Leading IT Solutions Company in Maldives",
    subtitle: "Transform your business with cutting-edge technology solutions. We help entrepreneurs turn their dreams into profitable ventures with robust, user-friendly applications.",
    cta_text: "Get Started",
  },
  about: {
    title: "Driving Digital Transformation",
    description: "Systems Solutions Pvt Ltd is a tech-leading IT consulting and software development company in the Digital Era! We have provisioned our esteemed clients with the Best-Suite Software Solutions. We mainly focus on ERP Development, Implementation, and integration.",
    mission: "Deliver innovative technology solutions that transform businesses and drive measurable growth.",
    vision: "Our journey began out of the passion for a unique position in the industry. To save time and money and to free up platform owners to concentrate on their main offering.",
    card_mission: "Deliver innovative technology solutions that transform businesses and drive measurable growth.",
    card_team: "Expert developers, designers, and consultants dedicated to your success.",
    card_quality: "Every solution we build meets the highest standards of performance and reliability.",
    card_global: "Serving clients across Maldives, Bhutan, and beyond with world-class solutions.",
  },
  services: {
    title: "Services & Solutions",
    subtitle: "Team up with the perfect digital partner for all your technical needs to achieve your business goals, reduce costs and accelerate growth.",
  },
  contact: {
    title: "Get In Touch",
    subtitle: "Ready to transform your business with cutting-edge technology? Contact us today for a free consultation.",
    address: "Alia Building, 7th Floor\nGandhakoalhi Magu\nMalé, Maldives",
    email: "info@solutions.com.mv",
    phone: "+960 301-1355",
    hours: "Sun–Thu: 9AM–6PM\nSat: 9AM–1PM",
  },
  footer: {
    copyright: "© 2025 Systems Solutions Pvt Ltd. All rights reserved.",
    tagline: "Leading IT consulting and software development company delivering cutting-edge technology solutions.",
  },
};

let contentCache: Record<string, Record<string, string>> | null = null;
let cacheTime = 0;
const CACHE_TTL = 0; // Always fresh — admin edits appear immediately

interface NetworkCompany {
  id: string; name: string; subtitle: string; desc: string;
  href: string; flag: string; accent: string; is_visible: boolean;
}

const DEFAULT_NETWORK: NetworkCompany[] = [
  { id: "1", name: "Brilliant Systems Solutions", subtitle: "Private Limited", desc: "Our sister company delivering innovative IT solutions across the Maldives.", href: "https://bsyssolutions.com", flag: "🇲🇻", accent: "#3b82f6", is_visible: true },
  { id: "2", name: "BSS Bhutan", subtitle: "Technology Partner", desc: "Expanding world-class digital solutions across the Kingdom of Bhutan.", href: "#", flag: "🇧🇹", accent: "#10b981", is_visible: true },
];

export function useNetworkCompanies(): NetworkCompany[] {
  const [companies, setCompanies] = useState<NetworkCompany[]>(DEFAULT_NETWORK);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("site_content").select("content").eq("section_key", "our_network").maybeSingle();
      if (data) {
        const c = data.content as any;
        if (Array.isArray(c?.companies)) setCompanies(c.companies);
      }
    };
    load();
    const channel = supabase
      .channel("our_network_footer")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_content" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return companies.filter((c) => c.is_visible);
}

export function useSiteContent(section: string): Record<string, string> {
  const [content, setContent] = useState<Record<string, string>>(DEFAULT_CONTENT[section] || {});

  useEffect(() => {
    const load = async () => {
      const now = Date.now();
      if (contentCache && now - cacheTime < CACHE_TTL) {
        setContent({ ...(DEFAULT_CONTENT[section] || {}), ...(contentCache[section] || {}) });
        return;
      }
      const { data } = await supabase.from("site_content").select("section_key,content");
      if (data) {
        const map: Record<string, Record<string, string>> = {};
        data.forEach((row) => {
          if (row.section_key !== "settings") {
            map[row.section_key] = row.content as Record<string, string>;
          }
        });
        contentCache = map;
        cacheTime = now;
        setContent({ ...(DEFAULT_CONTENT[section] || {}), ...(map[section] || {}) });
      }
    };
    load();

    // Realtime: refresh on changes
    const channel = supabase
      .channel(`site_content_${section}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_content" }, () => {
        contentCache = null;
        cacheTime = 0;
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [section]);

  return content;
}
