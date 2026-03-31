import { useEffect } from "react";
import { supabase } from "@/lib/localClient";

function setMeta(selector: string, attr: string, value: string) {
  if (!value) return;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    const [attrName, attrVal] = selector.replace("meta[", "").replace("]", "").split("=");
    el.setAttribute(attrName, attrVal.replace(/"/g, ""));
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function useSEO(pageKey = "home") {
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("seo_settings")
        .select("title,description,keywords,og_image")
        .eq("page_key", pageKey)
        .maybeSingle();
      if (!data) return;
      if (data.title)       document.title = data.title;
      if (data.description) setMeta('meta[name="description"]',        "content", data.description);
      if (data.keywords)    setMeta('meta[name="keywords"]',           "content", data.keywords);
      if (data.title)       setMeta('meta[property="og:title"]',       "content", data.title);
      if (data.description) setMeta('meta[property="og:description"]', "content", data.description);
      if (data.og_image)    setMeta('meta[property="og:image"]',       "content", data.og_image);
      if (data.title)       setMeta('meta[name="twitter:title"]',      "content", data.title);
      if (data.description) setMeta('meta[name="twitter:description"]',"content", data.description);
      if (data.og_image)    setMeta('meta[name="twitter:image"]',      "content", data.og_image);
    };
    load();

    const channel = supabase
      .channel(`seo_${pageKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "seo_settings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [pageKey]);
}
