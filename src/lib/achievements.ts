export interface Achievement {
  id:          string
  icon:        string
  title:       string
  description: string
  unlocked:    boolean
  color:       string
  category:    'xp' | 'quiz' | 'learning' | 'streak' | 'community'
}

interface AchievementInput {
  totalXp:           number
  chaptersValidated: number
  chaptersSeen:      number
  quizCompleted:     number
  perfectScores:     number   // quizzes with score === 100
  level3Quizzes:     number   // level 3 quizzes completed
  streakDays:        number
  domainsActive:     number   // domains with at least 1 chapter seen
}

export function computeAchievements(input: AchievementInput): Achievement[] {
  const {
    totalXp, chaptersValidated, chaptersSeen,
    quizCompleted, perfectScores, level3Quizzes,
    streakDays, domainsActive,
  } = input

  return [
    // ── XP milestones ──────────────────────────────────────────────
    {
      id: 'xp_100', icon: '⭐', category: 'xp' as const,
      title: 'Première étoile',
      description: 'Accumuler 100 XP',
      unlocked: totalXp >= 100,
      color: '#FFC13D',
    },
    {
      id: 'xp_500', icon: '🌟', category: 'xp' as const,
      title: 'Montée en puissance',
      description: 'Accumuler 500 XP',
      unlocked: totalXp >= 500,
      color: '#FFC13D',
    },
    {
      id: 'xp_1000', icon: '💫', category: 'xp' as const,
      title: 'Investisseur XP',
      description: 'Accumuler 1 000 XP',
      unlocked: totalXp >= 1000,
      color: '#FFC13D',
    },
    {
      id: 'xp_5000', icon: '🏅', category: 'xp' as const,
      title: 'Expert confirmé',
      description: 'Accumuler 5 000 XP',
      unlocked: totalXp >= 5000,
      color: '#FFC13D',
    },

    // ── Apprentissage ───────────────────────────────────────────────
    {
      id: 'first_chapter', icon: '📖', category: 'learning' as const,
      title: 'Premier pas',
      description: 'Ouvrir votre premier chapitre',
      unlocked: chaptersSeen >= 1,
      color: '#3183F7',
    },
    {
      id: 'first_validated', icon: '✅', category: 'learning' as const,
      title: 'Premier acquis',
      description: 'Valider votre premier chapitre',
      unlocked: chaptersValidated >= 1,
      color: '#36D399',
    },
    {
      id: 'chapters_5', icon: '📚', category: 'learning' as const,
      title: 'Lecteur assidu',
      description: 'Valider 5 chapitres',
      unlocked: chaptersValidated >= 5,
      color: '#3183F7',
    },
    {
      id: 'chapters_10', icon: '🎓', category: 'learning' as const,
      title: 'Diplômé Spread',
      description: 'Valider 10 chapitres',
      unlocked: chaptersValidated >= 10,
      color: '#A855F7',
    },
    {
      id: 'all_domains', icon: '🌐', category: 'learning' as const,
      title: 'Polygraphe',
      description: 'Explorer les 5 domaines',
      unlocked: domainsActive >= 5,
      color: '#A855F7',
    },

    // ── Quiz ─────────────────────────────────────────────────────────
    {
      id: 'first_quiz', icon: '🎯', category: 'quiz' as const,
      title: 'Testeur',
      description: 'Compléter votre premier quiz',
      unlocked: quizCompleted >= 1,
      color: '#A855F7',
    },
    {
      id: 'quiz_5', icon: '🏹', category: 'quiz' as const,
      title: 'Chasseur de quiz',
      description: 'Compléter 5 quiz',
      unlocked: quizCompleted >= 5,
      color: '#A855F7',
    },
    {
      id: 'perfect_score', icon: '💯', category: 'quiz' as const,
      title: 'Perfectionniste',
      description: 'Obtenir un score parfait (100%)',
      unlocked: perfectScores >= 1,
      color: '#36D399',
    },
    {
      id: 'level3_quiz', icon: '🧠', category: 'quiz' as const,
      title: 'Niveau Expert',
      description: 'Réussir un quiz niveau Difficile',
      unlocked: level3Quizzes >= 1,
      color: '#F56751',
    },

    // ── Streak ────────────────────────────────────────────────────────
    {
      id: 'streak_3', icon: '🔥', category: 'streak' as const,
      title: 'En feu',
      description: '3 jours consécutifs d\'activité',
      unlocked: streakDays >= 3,
      color: '#F56751',
    },
    {
      id: 'streak_7', icon: '🔥🔥', category: 'streak' as const,
      title: 'Semaine parfaite',
      description: '7 jours consécutifs d\'activité',
      unlocked: streakDays >= 7,
      color: '#F56751',
    },
    {
      id: 'streak_30', icon: '🏆', category: 'streak' as const,
      title: 'Discipline de fer',
      description: '30 jours consécutifs d\'activité',
      unlocked: streakDays >= 30,
      color: '#FFC13D',
    },
  ]
}
