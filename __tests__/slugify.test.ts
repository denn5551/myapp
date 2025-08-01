import { slugify } from "../lib/slugify";

test('slugify converts name', () => {
  expect(slugify('Финансовый советник')).toBe('finansovyi-sovetnik')
  expect(slugify('Test Name')).toBe('test-name')
})
