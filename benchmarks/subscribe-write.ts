#!/usr/bin/env npx ts-node

import { add, complete, cycle, save, suite } from 'benny'
import { atom } from '../src/vanilla/atom'
import type { PrimitiveAtom } from '../src/vanilla/atom'
import { createStore } from '../src/vanilla/store'

declare global {
  // eslint-disable-next-line no-var
  var __DEV__: boolean
}
globalThis.__DEV__ = false

const cleanupFns = new Set<() => void>()
const cleanup = () => {
  cleanupFns.forEach((fn) => fn())
  cleanupFns.clear()
}

const createStateWithAtoms = (n: number) => {
  let targetAtom: PrimitiveAtom<number> | undefined
  const store = createStore()
  for (let i = 0; i < n; ++i) {
    const a = atom(i)
    if (!targetAtom) {
      targetAtom = a
    }
    store.get(a)
    const unsub = store.sub(a, () => {
      store.get(a)
    })
    cleanupFns.add(unsub)
  }
  if (!targetAtom) {
    throw new Error()
  }
  return [store, targetAtom] as const
}

const main = async () => {
  for (const n of [2, 3, 4, 5, 6]) {
    await suite(
      `subscribe-write-${n}`,
      add(`atoms=${10 ** n}`, () => {
        cleanup()
        const [store, targetAtom] = createStateWithAtoms(10 ** n)
        return () => store.set(targetAtom, (c) => c + 1)
      }),
      cycle(),
      complete(),
      save({
        folder: __dirname,
        file: `subscribe-write-${n}`,
        format: 'json',
      }),
      save({
        folder: __dirname,
        file: `subscribe-write-${n}`,
        format: 'chart.html',
      })
    )
  }
}

main()
