-- Lier les offres à l'entreprise qui les a soumises
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS posted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index pour récupérer les offres d'une entreprise
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON public.jobs(posted_by);

-- RLS : une entreprise peut voir ET insérer ses propres offres (is_active = false par défaut)
DROP POLICY IF EXISTS "Enterprise can insert their own jobs" ON public.jobs;
CREATE POLICY "Enterprise can insert their own jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (
    auth.uid() = posted_by
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.account_type = 'enterprise'
    )
  );

DROP POLICY IF EXISTS "Enterprise can read their own jobs" ON public.jobs;
CREATE POLICY "Enterprise can read their own jobs"
  ON public.jobs FOR SELECT
  USING (
    is_active = true  -- jobs actifs visibles par tous
    OR auth.uid() = posted_by  -- l'entreprise voit aussi ses jobs en attente
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
