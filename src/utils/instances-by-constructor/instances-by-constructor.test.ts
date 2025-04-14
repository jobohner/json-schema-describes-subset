import { describe, it, expect } from 'vitest'

import { InstancesByConstructor } from './instances-by-constructor.js'

class A {
  constructor(public readonly text: string) {}
}

class B extends A {}
class C extends A {}
class D extends A {}

describe(InstancesByConstructor, () => {
  it('creates the correct instance arrays', () => {
    const instances = new InstancesByConstructor([
      new A('a'),
      new A('b'),
      new B('a'),
      new A('c'),
      new C('a'),
      new B('b'),
      new C('b'),
      new C('c'),
    ])

    expect(instances.get(A)).toMatchInlineSnapshot(`
      [
        A {
          "text": "a",
        },
        A {
          "text": "b",
        },
        A {
          "text": "c",
        },
      ]
    `)

    expect(instances.get(B)).toMatchInlineSnapshot(`
      [
        B {
          "text": "a",
        },
        B {
          "text": "b",
        },
      ]
    `)

    expect(instances.get(C)).toMatchInlineSnapshot(`
      [
        C {
          "text": "a",
        },
        C {
          "text": "b",
        },
        C {
          "text": "c",
        },
      ]
    `)

    expect(instances.get(D)).toMatchInlineSnapshot(`[]`)

    expect([...instances.getConstructors()].map(({ name }) => name))
      .toMatchInlineSnapshot(`
      [
        "A",
        "B",
        "C",
      ]
    `)
  })

  it('works without initial parameter', () => {
    const instances = new InstancesByConstructor()

    expect(instances.get(A)).toMatchInlineSnapshot(`[]`)

    expect(
      [...instances.getConstructors()].map(({ name }) => name),
    ).toMatchInlineSnapshot(`[]`)
  })
})
