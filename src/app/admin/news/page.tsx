import { adminClient } from '@/lib/supabase/admin-server'
import { NewsManager } from './NewsManager'

export const dynamic = 'force-dynamic'

export default async function AdminNewsPage() {
  const db = adminClient()

  const { data: items } = await db
    .from('platform_news')
    .select('id, title, content, type, emoji, link, is_published, published_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <div className="mb-6">
        <div className="text-lg font-black text-gray-900">Actualités plateforme</div>
        <div className="text-sm text-gray-500 mt-0.5">Gérer les annonces publiées aux utilisateurs</div>
      </div>
      <NewsManager items={items ?? []} />
    </div>
  )
}
