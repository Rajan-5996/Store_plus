/** Suggested questions in the Pulse AI drawer, per dashboard page (route path). */
export const chatChips: Record<string, string[]> = {
  overview: ['Which stores lose the most money and why?', 'How many stores are above break-even?', 'How did network orders trend this month?'],
  utilisation: ['Where do we have spare capacity?', 'Which stores are constrained at peak hours?'],
  inventory: ['Which stores have the highest stock-out rate?', 'Which SKUs risk expiring unsold?'],
  operations: ['Which stores have the slowest picking?', 'Where are late deliveries concentrated?'],
  profitability: ['Why is store #412 losing money?', 'What is the break-even gap by store?'],
  network: ['Which store pairs overlap the most?', 'Where is demand not being served?'],
  productmix: ['Which categories earn the lowest margin?', 'What are customers searching for that we do not stock?'],
}

export const defaultChips = chatChips.overview

/** What the agent covers on each page, shown as the first message in the drawer. */
export const chatScope: Record<string, string> = {
  overview: 'overall questions about every store in the network',
}
