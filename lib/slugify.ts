import baseSlugify from 'slugify'

// Override default transliteration to match expected Russian mapping
baseSlugify.extend({
  'й': 'i',
  'Й': 'I',
})

export function slugify(text: string): string {
  return baseSlugify(text, { lower: true, strict: true, locale: 'ru' })
}

