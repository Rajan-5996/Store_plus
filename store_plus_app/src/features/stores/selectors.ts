import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { CONTRIBUTION_PER_ORDER } from '../../data/stores'

const selectItems = (s: RootState) => s.stores.items

export const selectTopLosers = createSelector([selectItems], (items) => items.slice(0, 5))

export const dailyPnl = (orders: number, breakEven: number) =>
  (orders - breakEven) * CONTRIBUTION_PER_ORDER
