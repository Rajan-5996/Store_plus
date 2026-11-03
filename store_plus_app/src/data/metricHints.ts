/**
 * How each KPI is calculated, shown in the ⓘ tooltip beside its label (keyed by the KPI label).
 * Wording mirrors the backend definitions in store_plus_server/app/services.
 */
const CONTRIBUTION =
  'contribution (product margin + customer fees + ad income − coupons, rider, packaging, payment and refund costs − wastage)'
const LOSS = 'Sum of the average daily losses of the loss-making stores. Profitable stores are not netted off.'
const BREAK_EVEN = `Stores whose daily profit is above zero: ${CONTRIBUTION} minus fixed operating costs.`

export const metricHints: Record<string, string> = {
  // Network overview
  'Total stores': 'Dark stores with sales in the selected city and date range.',
  'Above break-even': BREAK_EVEN,
  'Daily network loss': LOSS,
  'Avg orders/store/day': 'Delivered orders per store per day, compared with the same number of days just before the selected range.',

  // Store utilisation
  'Average capacity utilisation': 'Orders accepted ÷ hourly processing capacity, across all stores and hours in the range.',
  'Stores with spare capacity': 'Stores using less than 70% of their processing capacity.',
  'Peak-hour constrained stores': 'Stores that spend 65 minutes or more a day in busy mode, paused for new orders because they cannot keep up.',
  'Potential additional orders/day': 'Orders lost each day while stores were in busy mode: demand the network could have served.',

  // Inventory intelligence
  'Stockout rate': 'Share of store–product days on which the product was out of stock at any point.',
  'At-risk inventory': 'Cost value of perishable stock with more days of cover than half its shelf life, so it is likely to expire before it sells.',
  'Slow-moving SKUs': 'Products holding more than 7 days of stock at their current rate of sale.',
  'Replenishment alerts': 'Store–product pairs selling at least one unit a day that have less than half of forecast demand in stock.',

  // Operational efficiency
  'Median pick time': 'Median minutes from picking start to picking complete, on delivered orders.',
  'Peak queue time': 'Average wait before picking starts, in the busiest hour of the day.',
  'Order pause time/day': 'Minutes per store per day in busy mode, when the store stops taking new orders.',
  'Orders per picker-hour': 'Orders accepted ÷ picker hours on the floor: a measure of picking productivity.',

  // Store profitability
  'Stores above break-even': BREAK_EVEN,
  'Network daily loss': LOSS,
  'Average contribution/order': `Per delivered order, before fixed store costs: ${CONTRIBUTION}.`,
  'Highest cost driver': 'The two largest fixed operating costs across the network: rent, staff, utilities or other operating costs.',

  // Network optimisation
  'Stores in network': 'Dark stores in the selected city.',
  'High-overlap pairs': "Pairs of stores where at least 15% of the smaller store's delivery area is also served by the other store.",
  'Underserved demand pockets': 'Areas outside every delivery zone with 3,000 or more app sessions a day, grouped around the nearest store.',
  'Expansion candidates': 'Underserved pockets in more affluent areas (affluence index 4.2 or higher): candidates for a new store.',

  // Product mix
  'Average basket value': 'Gross order value ÷ delivered orders.',
  'Categories analysed': 'Product sub-categories with sales in the selected range.',
  'Low-contribution SKUs': 'Products earning less than 8% product margin on their revenue.',
  'Assortment opportunities': 'Search terms with no matching product, searched 40 or more times: products customers want that are not stocked.',

  // Store page
  'Orders per day': 'Delivered orders per day, compared with the same number of days just before the selected range.',
  'Profit / loss per day': `Daily ${CONTRIBUTION} minus fixed operating costs.`,
  'Gap to break-even': 'Extra orders a day this store needs to cover its fixed costs at its current contribution per order.',
  'Visit-to-order conversion': 'Orders placed ÷ app sessions served by this store.',

  // Transfer log
  'Units of stock moving': 'Units in stock transfers that are planned or done. Cancelled transfers are excluded.',
}
