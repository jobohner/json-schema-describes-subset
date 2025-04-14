import { describe, it, expect } from 'vitest'

import {
  contributorRegExp,
  parseContributorString,
  createContributorsSection,
} from './contributors.js'

describe('contributorRegExp', () => {
  it('matches correctly', () => {
    expect(contributorRegExp.exec('test name')).toMatchInlineSnapshot(`
      [
        "test name",
        "test name",
        undefined,
        undefined,
        undefined,
        undefined,
      ]
    `)

    expect(contributorRegExp.exec('test name <test@example.com>'))
      .toMatchInlineSnapshot(`
      [
        "test name <test@example.com>",
        "test name",
        "<test@example.com>",
        "test@example.com",
        undefined,
        undefined,
      ]
    `)

    expect(contributorRegExp.exec('test name (www.example.com)  '))
      .toMatchInlineSnapshot(`
        [
          "test name (www.example.com)  ",
          "test name",
          undefined,
          undefined,
          "(www.example.com)",
          "www.example.com",
        ]
      `)

    expect(
      contributorRegExp.exec('test name <test@example.com> (www.example.com)'),
    ).toMatchInlineSnapshot(`
      [
        "test name <test@example.com> (www.example.com)",
        "test name",
        "<test@example.com>",
        "test@example.com",
        "(www.example.com)",
        "www.example.com",
      ]
    `)

    expect(
      contributorRegExp.exec('<test@example.com> (www.example.com)'),
    ).toMatchInlineSnapshot(`null`)

    expect(
      contributorRegExp.exec('  <test@example.com> (www.example.com)'),
    ).toMatchInlineSnapshot(`null`)
  })
})

describe(parseContributorString, () => {
  it('matches correctly', () => {
    expect(parseContributorString('test name')).toMatchInlineSnapshot(`
      {
        "email": undefined,
        "name": "test name",
        "url": undefined,
      }
    `)

    expect(parseContributorString('test name <test@example.com>'))
      .toMatchInlineSnapshot(`
        {
          "email": "test@example.com",
          "name": "test name",
          "url": undefined,
        }
      `)

    expect(parseContributorString('test name (www.example.com)  '))
      .toMatchInlineSnapshot(`
        {
          "email": undefined,
          "name": "test name",
          "url": "www.example.com",
        }
      `)

    expect(
      parseContributorString('test name <test@example.com> (www.example.com)'),
    ).toMatchInlineSnapshot(`
        {
          "email": "test@example.com",
          "name": "test name",
          "url": "www.example.com",
        }
      `)

    expect(() =>
      parseContributorString('  <test@example.com> (www.example.com)'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid contributor '  <test@example.com> (www.example.com)']`,
    )
  })
})

describe(createContributorsSection, () => {
  it('creates the expected snippet', () => {
    expect(createContributorsSection([])).toMatchInlineSnapshot(`""`)

    expect(
      createContributorsSection([
        'person a <person-a@example.com> (www.example.com/a)',
        { name: 'person b' },
      ]),
    ).toMatchInlineSnapshot(`
      "- person a <person-a@example.com> <www.example.com/a>
      - person b"
    `)
  })
})
