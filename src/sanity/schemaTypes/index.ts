import { type SchemaTypeDefinition } from 'sanity'
import { chapterSchema, articleSchema, quizSchema, evaluationSchema, weeklyQuizSchema } from '@/lib/sanity/schema'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [chapterSchema, articleSchema, quizSchema, evaluationSchema, weeklyQuizSchema] as SchemaTypeDefinition[],
}
