import { lazy, Suspense, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import UICustomizer from "@/components/UICustomizer";
import ScrollProgress from "@/components/ScrollProgress";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSEO } from "@/hooks/useSEO";

// Lazy load all below-fold sections — improves initial load dramatically
const AboutSection       = lazy(() => import("@/components/AboutSection"));
const ServicesSection    = lazy(() => import("@/components/ServicesSection"));
const ProductsSection    = lazy(() => import("@/components/ProductsSection"));
const ClientsSection     = lazy(() => import("@/components/ClientsSection"));
const WorldMap           = lazy(() => import("@/components/WorldMap"));
const TestimonialsSection= lazy(() => import("@/components/TestimonialsSection"));
const CareersSection     = lazy(() => import("@/components/CareersSection"));
const ContactSection     = lazy(() => import("@/components/ContactSection"));
const Footer             = lazy(() => import("@/components/Footer"));
const WhatsAppButton     = lazy(() => import("@/components/WhatsAppButton"));
const ScrollToTop        = lazy(() => import("@/components/ScrollToTop"));
const CookieConsent      = lazy(() => import("@/components/CookieConsent"));
const GuidedTour         = lazy(() => import("@/components/GuidedTour"));

// Minimal fallback — invisible placeholder keeps layout stable
const Blank = () => <div style={{ minHeight: 20 }} />;

const Index = () => {
  useSiteSettings();
  useSEO();

  useEffect(() => {
    // Force scroll to top on refresh and clear hash targeting
    window.scrollTo({ top: 0, behavior: "instant" });
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Header />
      <HeroSection />

      <Suspense fallback={<Blank />}>
        <AboutSection />
      </Suspense>

      <Suspense fallback={<Blank />}>
        <ServicesSection />
      </Suspense>

      <Suspense fallback={<Blank />}>
        <ProductsSection />
      </Suspense>

      <Suspense fallback={<Blank />}>
        <ClientsSection />
      </Suspense>

      <Suspense fallback={<Blank />}>
        <WorldMap />
      </Suspense>

      <Suspense fallback={<Blank />}>
        <TestimonialsSection />
      </Suspense>

      <Suspense fallback={<Blank />}>
        <CareersSection />
      </Suspense>

      <Suspense fallback={<Blank />}>
        <ContactSection />
      </Suspense>

      <Suspense fallback={<Blank />}>
        <Footer />
      </Suspense>

      <Suspense fallback={null}>
        <WhatsAppButton />
        <ScrollToTop />
        <CookieConsent />
        <GuidedTour />
      </Suspense>

      <UICustomizer />
    </div>
  );
};

export default Index;
