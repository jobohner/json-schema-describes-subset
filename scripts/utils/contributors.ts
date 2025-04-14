type Contributor = {
  name: string
  email?: string | undefined
  url?: string | undefined
}

export const contributorRegExp =
  /^([^<(]*[^<(\s]+)\s*(<([^>(]+)>)?\s*(\(([^)]+)\))?\s*$/

export function parseContributorString(contributorString: string): Contributor {
  const [, name, , email, , url] =
    contributorString.match(contributorRegExp) ?? []

  if (name === undefined) {
    throw new Error(`invalid contributor '${contributorString}'`)
  }

  return { name, email, url }
}

export function createContributorsSection(
  contributors: (Contributor | string)[],
): string {
  return contributors
    .map((contributor) =>
      typeof contributor !== 'string'
        ? contributor
        : parseContributorString(contributor),
    )
    .map(
      ({ name, email, url }) =>
        '- ' +
        [name, email && `<${email}>`, url && `<${url}>`]
          .filter(Boolean)
          .join(' '),
    )
    .join('\n')
}
