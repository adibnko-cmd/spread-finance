// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — Sanity CMS Schema
// Structure : Domain → Part → Chapter + Article
// ═══════════════════════════════════════════════════════════════════

// ── CHAPITRE DE DOCUMENTATION ────────────────────────────────────
export const chapterSchema = {
  name: 'chapter',
  title: 'Chapitre',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Titre du chapitre',
      type: 'string',
      validation: (r: any) => r.required().min(5).max(120),
    },
    {
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title', maxLength: 100 },
      validation: (r: any) => r.required(),
    },
    {
      name: 'domain',
      title: 'Domaine',
      type: 'string',
      options: {
        list: [
          { title: 'Finance de marché',         value: 'finance' },
          { title: 'Mathématiques financières',  value: 'maths' },
          { title: 'Développement IT',           value: 'dev' },
          { title: 'Gestion de projet',          value: 'pm' },
          { title: 'Machine Learning',           value: 'ml' },
        ],
      },
      validation: (r: any) => r.required(),
    },
    {
      name: 'part',
      title: 'Numéro de partie',
      type: 'number',
      validation: (r: any) => r.required().min(1).max(10),
    },
    {
      name: 'partTitle',
      title: 'Titre de la partie',
      type: 'string',
    },
    {
      name: 'order',
      title: 'Ordre dans la partie',
      type: 'number',
      validation: (r: any) => r.required().min(1),
    },
    {
      name: 'accessLevel',
      title: 'Niveau d\'accès',
      type: 'string',
      options: {
        list: [
          { title: '🟢 Gratuit (Free)',  value: 'free' },
          { title: '🔵 Premium',         value: 'premium' },
        ],
      },
      validation: (r: any) => r.required(),
    },
    {
      name: 'difficulty',
      title: 'Niveau de difficulté',
      type: 'string',
      options: {
        list: [
          { title: 'Débutant',      value: 'beginner' },
          { title: 'Intermédiaire', value: 'intermediate' },
          { title: 'Avancé',        value: 'advanced' },
        ],
      },
    },
    {
      name: 'estimatedReadingTime',
      title: 'Temps de lecture estimé (minutes)',
      type: 'number',
      validation: (r: any) => r.min(1).max(120),
    },
    {
      name: 'excerpt',
      title: 'Résumé court (pour les cartes)',
      type: 'text',
      rows: 2,
      validation: (r: any) => r.max(200),
    },
    {
      name: 'content',
      title: 'Contenu du chapitre',
      type: 'array',
      of: [
        { type: 'block' }, // Texte riche (Portable Text)
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            { name: 'caption', title: 'Légende', type: 'string' },
            { name: 'alt',     title: 'Texte alternatif', type: 'string' },
          ],
        },
        {
          // Bloc de code
          type: 'object',
          name: 'codeBlock',
          title: 'Bloc de code',
          fields: [
            { name: 'language', title: 'Langage', type: 'string',
              options: { list: ['python', 'javascript', 'typescript', 'sql', 'bash', 'json'] } },
            { name: 'code', title: 'Code', type: 'text' },
            { name: 'filename', title: 'Nom du fichier (optionnel)', type: 'string' },
          ],
        },
        {
          // Bloc de mise en évidence (Note, Attention, Important)
          type: 'object',
          name: 'callout',
          title: 'Callout (Note / Attention / Important)',
          fields: [
            { name: 'type',    title: 'Type', type: 'string',
              options: { list: ['info', 'warning', 'danger', 'success', 'tip'] } },
            { name: 'title',   title: 'Titre (optionnel)', type: 'string' },
            { name: 'content', title: 'Contenu', type: 'text' },
          ],
        },
        {
          // Formule mathématique
          type: 'object',
          name: 'formula',
          title: 'Formule mathématique',
          fields: [
            { name: 'latex',   title: 'LaTeX', type: 'string' },
            { name: 'caption', title: 'Légende', type: 'string' },
          ],
        },
        {
          // Onglets d'exemples
          type: 'object',
          name: 'exampleTabs',
          title: 'Exemples (onglets)',
          fields: [
            {
              name: 'tabs',
              title: 'Onglets',
              type: 'array',
              of: [{
                type: 'object',
                name: 'tab',
                fields: [
                  { name: 'label',    title: 'Libellé de l\'onglet', type: 'string' },
                  { name: 'language', title: 'Langage',              type: 'string' },
                  { name: 'code',     title: 'Contenu',              type: 'text' },
                ],
              }],
            },
          ],
        },
      ],
    },
    {
      name: 'flashcard',
      title: 'Fiche récapitulative PDF',
      type: 'file',
      options: { accept: '.pdf' },
    },
    {
      name: 'quizAvailable',
      title: 'Quiz disponible',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'relatedArticles',
      title: 'Articles liés',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'article' }] }],
    },
    {
      name: 'relatedChapters',
      title: 'Chapitres liés (concepts interconnectés)',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'chapter' }] }],
    },
    {
      name: 'seoTitle',
      title: 'Titre SEO (optionnel)',
      type: 'string',
      group: 'seo',
    },
    {
      name: 'seoDescription',
      title: 'Description SEO (optionnel)',
      type: 'text',
      rows: 2,
      group: 'seo',
    },
  ],
  groups: [
    { name: 'seo', title: 'SEO' },
  ],
  preview: {
    select: {
      title:    'title',
      domain:   'domain',
      part:     'part',
      access:   'accessLevel',
    },
    prepare: ({ title, domain, part, access }: any) => ({
      title,
      subtitle: `${domain} · Partie ${part} · ${access === 'free' ? '🟢 Free' : '🔵 Premium'}`,
    }),
  },
  orderings: [
    {
      title: 'Par domaine et ordre',
      name: 'domainPartOrder',
      by: [
        { field: 'domain', direction: 'asc' },
        { field: 'part',   direction: 'asc' },
        { field: 'order',  direction: 'asc' },
      ],
    },
  ],
}

// ── ARTICLE ──────────────────────────────────────────────────────
export const articleSchema = {
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    { name: 'title', title: 'Titre', type: 'string', validation: (r: any) => r.required() },
    { name: 'slug',  title: 'Slug', type: 'slug',
      options: { source: 'title' }, validation: (r: any) => r.required() },
    { name: 'domain', title: 'Domaine principal', type: 'string',
      options: { list: ['finance', 'maths', 'dev', 'pm', 'ml'] },
      validation: (r: any) => r.required() },
    { name: 'accessLevel', title: 'Accès', type: 'string',
      options: { list: [{ title: '🟢 Free', value: 'free' }, { title: '🔵 Premium', value: 'premium' }] },
      validation: (r: any) => r.required() },
    { name: 'publishedAt', title: 'Date de publication', type: 'datetime' },
    { name: 'estimatedReadingTime', title: 'Temps de lecture (min)', type: 'number' },
    { name: 'excerpt', title: 'Résumé', type: 'text', rows: 3 },
    { name: 'coverImage', title: 'Image de couverture', type: 'image', options: { hotspot: true } },
    { name: 'content', title: 'Contenu', type: 'array',
      of: [
        { type: 'block' },
        { type: 'image' },
        {
          type: 'object',
          name: 'exampleTabs',
          title: 'Exemples (onglets)',
          fields: [{
            name: 'tabs',
            title: 'Onglets',
            type: 'array',
            of: [{
              type: 'object',
              name: 'tab',
              fields: [
                { name: 'label',    title: 'Libellé', type: 'string' },
                { name: 'language', title: 'Langage',  type: 'string' },
                { name: 'code',     title: 'Contenu',  type: 'text' },
              ],
            }],
          }],
        },
        {
          type: 'object',
          name: 'code',
          title: 'Bloc de code',
          fields: [
            { name: 'language', title: 'Langage', type: 'string' },
            { name: 'code',     title: 'Code',    type: 'text' },
          ],
        },
      ] },
    { name: 'relatedChapters', title: 'Chapitres liés', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'chapter' }] }] },
  ],
  preview: {
    select: { title: 'title', domain: 'domain', access: 'accessLevel' },
    prepare: ({ title, domain, access }: any) => ({
      title,
      subtitle: `${domain} · ${access === 'free' ? '🟢 Free' : '🔵 Premium'}`,
    }),
  },
}

// ── QUIZ QUESTIONS (stockées dans Sanity) ────────────────────────
export const quizSchema = {
  name: 'quiz',
  title: 'Quiz',
  type: 'document',
  fields: [
    { name: 'chapterSlug', title: 'Slug du chapitre associé', type: 'string',
      validation: (r: any) => r.required() },
    { name: 'level',       title: 'Niveau', type: 'number',
      options: { list: [{ title: 'Niveau 1 — Facile', value: 1 },
                        { title: 'Niveau 2 — Moyen',  value: 2 },
                        { title: 'Niveau 3 — Avancé', value: 3 }] },
      validation: (r: any) => r.required() },
    {
      name: 'questions',
      title: 'Questions',
      type: 'array',
      of: [{
        type: 'object',
        name: 'question',
        fields: [
          { name: 'text',          title: 'Question', type: 'string', validation: (r: any) => r.required() },
          { name: 'explanation',   title: 'Explication (affichée après réponse)', type: 'text' },
          {
            name: 'answers',
            title: 'Réponses',
            type: 'array',
            of: [{
              type: 'object',
              fields: [
                { name: 'text',      title: 'Texte de la réponse', type: 'string' },
                { name: 'isCorrect', title: 'Bonne réponse ?',     type: 'boolean' },
              ],
            }],
            validation: (r: any) => r.min(2).max(5),
          },
        ],
      }],
      validation: (r: any) => r.min(3),
    },
  ],
}

// Export du schéma complet pour sanity.config.ts
export const schemaTypes = [chapterSchema, articleSchema, quizSchema]
