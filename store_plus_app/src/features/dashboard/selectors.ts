import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import type { WarehouseApi } from '@/types/api'

const selectCity = (s: RootState) => s.filters.city
const selectStore = (s: RootState) => s.filters.store
const selectAll = (s: RootState) => s.dashboard.network.data?.warehouses

/** Every store of every region: the 3D scene and pins stay loaded so the camera can glide between cities. */
const NONE: WarehouseApi[] = []
export const selectAllWarehouses = (s: RootState): WarehouseApi[] => selectAll(s) ?? NONE

/** Stores of the selected city (all regions for "All cities"): the options of the map's store filter. */
export const selectCityStores = createSelector([selectAll, selectCity], (all, city): WarehouseApi[] =>
  (all ?? []).filter((w) => city === 'all' || w.cityCode === city),
)

/** Stores drawn on the map: the city's stores, or just the one picked in the store filter. */
export const selectMapWarehouses = createSelector([selectCityStores, selectStore], (stores, store): WarehouseApi[] =>
  store === 'all' ? stores : stores.filter((w) => w.id === store),
)
