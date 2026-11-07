/**
 * Fields of an institution that anyone may see. Anything about the institution's
 * contact person (user id, name, email) is left out on purpose.
 */
export const PUBLIC_INSTITUTION_SELECT = {
  id: true,
  name: true,
  city: true,
  state: true,
  logoUrl: true,
  websiteUrl: true,
  cellTheme: true,
  createdAt: true,
  _count: { select: { proposals: true } },
} as const;
