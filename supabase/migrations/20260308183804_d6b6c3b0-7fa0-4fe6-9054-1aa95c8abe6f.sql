
CREATE TABLE public.seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  keywords text NOT NULL DEFAULT '',
  og_image text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read SEO settings" ON public.seo_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert SEO settings" ON public.seo_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update SEO settings" ON public.seo_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'));

INSERT INTO public.seo_settings (page_key, title, description, keywords)
VALUES ('home', 'Systems Solutions - IT Services & Consulting', 'Leading IT services and consulting company in the Maldives providing enterprise solutions, cloud services, and digital transformation.', 'IT services, Maldives, consulting, cloud, digital transformation');
