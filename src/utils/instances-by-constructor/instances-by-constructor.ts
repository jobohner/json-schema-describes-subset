// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor = new (...args: any[]) => object

export class InstancesByConstructor {
  readonly #map = new Map<object['constructor'], object[]>()

  constructor(instances?: Iterable<object> | undefined) {
    if (instances !== undefined) {
      this.push(...instances)
    }
  }

  push(...instances: object[]): void {
    for (const instance of instances) {
      const mappedInstances = this.#map.get(instance.constructor)
      if (mappedInstances === undefined) {
        this.#map.set(instance.constructor, [instance])
      } else {
        mappedInstances.push(instance)
      }
    }
  }

  get<Constructor_ extends Constructor>(
    constructor: Constructor_,
  ): InstanceType<Constructor_>[] {
    return (this.#map.get(constructor) ?? []) as InstanceType<Constructor_>[]
  }

  has(constructor: Constructor): boolean {
    return this.#map.has(constructor)
  }

  delete(constructor: Constructor): boolean {
    return this.#map.delete(constructor)
  }

  getConstructors(): MapIterator<object['constructor']> {
    return this.#map.keys()
  }
}
