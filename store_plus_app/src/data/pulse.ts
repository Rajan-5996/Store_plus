/** Suggested questions on the Pulse AI page, per dashboard screen the question is about. */
export const PULSE_SUGGESTIONS: Record<string, string[]> = {
  overview: ['Which stores lose the most money and why?', 'How many stores are above break-even?', 'How did network orders trend this month?'],
  utilisation: ['Where do we have spare capacity?', 'Which stores are constrained at peak hours?'],
  inventory: ['Which stores have the highest stock-out rate?', 'Which SKUs risk expiring unsold?'],
  operations: ['Which stores have the slowest picking?', 'Where are late deliveries concentrated?'],
  profitability: ['Why is store #524 losing money?', 'What is the break-even gap by store?'],
  network: ['Which store pairs overlap the most?', 'Where is demand not being served?'],
  productmix: ['Which categories earn the lowest margin?', 'What are customers searching for that we do not stock?'],
}

/** Screens Pulse can focus on (the backend reads that screen's numbers first); 'all' lets it pick from the question. */
export const PULSE_FOCUS = ['all', 'overview', 'utilisation', 'inventory', 'operations', 'profitability', 'network', 'productmix'] as const
