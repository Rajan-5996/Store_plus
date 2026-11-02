/** Route of a store's page: "#524" or "524" -> "/store/524". */
export const storePath = (code: string): string => `/store/${code.replace(/\D/g, '')}`
