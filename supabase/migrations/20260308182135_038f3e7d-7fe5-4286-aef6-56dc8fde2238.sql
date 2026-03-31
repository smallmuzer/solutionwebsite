
-- Add rate limiting: max 5 submissions per hour per IP-like constraint using email
-- We'll add a constraint function instead
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.contact_submissions 
      WHERE email = NEW.email 
      AND created_at > now() - interval '1 hour') >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER contact_rate_limit
  BEFORE INSERT ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.check_contact_rate_limit();
