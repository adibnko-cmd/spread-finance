export type ShopItem = {
  id:          string
  name:        string
  description: string
  price:       number
  category:    'boost' | 'cosmetic'
  icon:        string
  durationH?:  number
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id:          'boost_xp2_24h',
    name:        'Boost XP ×2',
    description: 'Double tous vos gains d\'XP pendant 24 heures.',
    price:       20,
    category:    'boost',
    icon:        '⚡',
    durationH:   24,
  },
  {
    id:          'boost_speed_time',
    name:        'Temps Bonus Speed',
    description: '+10 secondes par question en mode Speed Quiz.',
    price:       15,
    category:    'boost',
    icon:        '⏱️',
    durationH:   undefined,
  },
  {
    id:          'quiz_retry_pass',
    name:        'Retry Pass',
    description: 'Relancez un quiz échoué sans pénalité de délai.',
    price:       10,
    category:    'boost',
    icon:        '🔄',
    durationH:   undefined,
  },
  {
    id:          'cosmetic_gold_frame',
    name:        'Cadre Avatar Gold',
    description: 'Cadre doré autour de votre avatar sur le classement.',
    price:       50,
    category:    'cosmetic',
    icon:        '🥇',
  },
  {
    id:          'cosmetic_diamond_frame',
    name:        'Cadre Avatar Diamond',
    description: 'Cadre diamant exclusif — affiché sur tous vos scores.',
    price:       100,
    category:    'cosmetic',
    icon:        '💎',
  },
  {
    id:          'cosmetic_streak_fire',
    name:        'Streak Flame Animée',
    description: 'Animation de flamme spéciale sur votre compteur de streak.',
    price:       30,
    category:    'cosmetic',
    icon:        '🔥',
  },
]
