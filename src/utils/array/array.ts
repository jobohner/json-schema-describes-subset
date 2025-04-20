import findIndex from 'lodash/findIndex.js'

export function createSameElementsArray<const ElementType>(
  length: number,
  elementValue: ElementType,
): ElementType[] {
  return Array.from({ length }).map(() => elementValue)
}

export function splitArray<const ElementType>(
  array: ElementType[],
  predicate: (element: ElementType) => boolean,
  options: {
    includeSplitterElement?: 'prefix' | 'suffix' | null | undefined
  } = {},
): ElementType[][] {
  let currentGroup: ElementType[] = []
  const result: ElementType[][] = [currentGroup]

  for (const element of array) {
    if (predicate(element)) {
      if (options.includeSplitterElement === 'suffix') {
        currentGroup.push(element)
      }
      currentGroup = []
      if (options.includeSplitterElement === 'prefix') {
        currentGroup.push(element)
      }
      result.push(currentGroup)
    } else {
      currentGroup.push(element)
    }
  }

  return result
}

export function getElementsBetween<ElementType>(
  array: ElementType[],
  startPredicate: Parameters<typeof findIndex>[1],
  endPredicate: Parameters<typeof findIndex>[1],
): ElementType[][] {
  const startIndex: number = findIndex(array, startPredicate) + 1

  if (startIndex === 0) {
    return []
  }

  const endIndex: number = findIndex(array, endPredicate, startIndex + 1)

  if (endIndex < 0) {
    return [array.slice(startIndex)]
  }

  return [
    array.slice(startIndex, endIndex),
    ...getElementsBetween(
      array.slice(endIndex + 1),
      startPredicate,
      endPredicate,
    ),
  ]
}

export function forEachInRange<ElementType>(
  array: ElementType[],
  {
    start = 0,
    end = array.length,
    step = 1,
  }: {
    start?: number | undefined
    end?: number | undefined
    step?: number | undefined
  },
  callbackFn: (
    element: ElementType,
    index: number,
    array: ElementType[],
  ) => void,
): void {
  for (let i = Math.max(0, start); i < Math.min(array.length, end); i += step) {
    callbackFn(array[i] as ElementType, i, array)
  }
}

export function forEachElementCombination<ElementType>(
  array: ElementType[],
  callbackFn: (
    elementA: ElementType,
    elementB: ElementType,
    indexA: number,
    indexB: number,
    array: ElementType[],
  ) => void,
): void {
  forEachInRange(array, { start: 1 }, (elementA, indexA) => {
    forEachInRange(array, { end: indexA }, (elementB, indexB) => {
      callbackFn(elementA, elementB, indexA, indexB, array)
    })
  })
}
