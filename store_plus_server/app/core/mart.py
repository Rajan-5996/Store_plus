"""SQL for the store x day mart. Follows the Metric Definitions sheet of the data dictionary."""

STORE_DAY_SQL = """
create table store_day as
with o as (
  select store_id, business_date as date,
    count(*) filter (where order_status = 'Delivered') as delivered,
    sum(item_value + delivery_fee + small_cart_fee + handling_fee + late_night_fee + rain_surge_fee)
      filter (where order_status = 'Delivered') as gov,
    sum(delivery_fee + small_cart_fee + handling_fee + late_night_fee + rain_surge_fee)
      filter (where order_status = 'Delivered') as fees,
    sum(coupon_discount + rider_payout_inr + packaging_cost_inr + payment_gateway_cost_inr + refund_inr)
      filter (where order_status = 'Delivered') as var_cost
  from fact_orders group by 1, 2
), m as (
  select o.store_id, o.business_date as date, sum(i.quantity * (i.unit_selling_price - i.unit_cost)) as margin
  from fact_order_items i join fact_orders o using (order_id)
  where o.order_status = 'Delivered' group by 1, 2
), w as (
  select store_id, date, sum(value_at_cost_inr) as wastage from fact_wastage group by 1, 2
)
select o.store_id, o.date, o.delivered, o.gov, o.fees, o.var_cost, m.margin,
  coalesce(w.wastage, 0) as wastage, f.ad_income_inr as ad,
  f.rent_inr as rent, f.staff_cost_inr as staff, f.electricity_cost_inr as elec,
  f.housekeeping_security_inr + f.maintenance_inr + f.inbound_logistics_inr
    + f.it_connectivity_inr + f.other_opex_inr as other_opex,
  f.rent_inr + f.staff_cost_inr + f.electricity_cost_inr + f.housekeeping_security_inr
    + f.maintenance_inr + f.inbound_logistics_inr + f.it_connectivity_inr + f.other_opex_inr as opex
from o
left join m using (store_id, date)
left join w using (store_id, date)
left join fact_store_finance_daily f using (store_id, date)
"""

# contribution before store opex, per day: product margin + fees + ad income - variable costs - wastage
CONTRIB = "(margin + fees + ad - var_cost - wastage)"

# delivered units, revenue and cost per store x day x SKU (from 17M order lines) for the product-mix and inventory pages
SKU_DAY_SQL = """
create table sku_day as
select o.store_id, o.business_date as date, i.sku_id, sum(i.quantity) as units,
  sum(i.quantity * i.unit_selling_price) as revenue, sum(i.quantity * i.unit_cost) as cost,
  sum(i.quantity * (i.unit_mrp - i.unit_selling_price)) as discount
from fact_order_items i join fact_orders o using (order_id)
where o.order_status = 'Delivered' group by 1, 2, 3
"""
