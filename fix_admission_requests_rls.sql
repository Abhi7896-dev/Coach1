-- =========================================================================================
-- Fix Permission / RLS for Public Free Trial & Admission Requests
-- =========================================================================================

-- 1. Grant EXECUTE on get_my_role function to public/anon (fixes 'permission denied for function get_my_role')
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon, authenticated, service_role;

-- 2. Allow public/anon visitors to submit (INSERT) free trial and admission requests from the website
DO $$
BEGIN
  -- Drop existing conflicting insert policy if any
  DROP POLICY IF EXISTS "Public can submit admission requests" ON public.admission_requests;
  DROP POLICY IF EXISTS "Anyone can submit trial requests" ON public.admission_requests;
  DROP POLICY IF EXISTS "Enable insert for anon and authenticated users" ON public.admission_requests;
  
  -- Create policy allowing anyone (website visitors) to submit a trial request
  CREATE POLICY "Public can submit admission requests"
    ON public.admission_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
    
  -- Grant table permissions
  GRANT INSERT ON public.admission_requests TO anon, authenticated;
  GRANT SELECT, UPDATE, DELETE ON public.admission_requests TO authenticated, service_role;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adjusting policies: %', SQLERRM;
END $$;
