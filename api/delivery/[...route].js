import bulkUpdatePrices from '../_delivery/bulk-update-prices.js';
import companies from '../_delivery/companies.js';
import connectRestaurant from '../_delivery/connect-restaurant.js';
import syncMenu from '../_delivery/sync-menu.js';
import updateItemAvailability from '../_delivery/update-item-availability.js';
import updateOrderStatus from '../_delivery/update-order-status.js';
import webhook from '../_delivery/webhook.js';

const handlers = {
  'bulk-update-prices': bulkUpdatePrices,
  'companies': companies,
  'connect-restaurant': connectRestaurant,
  'sync-menu': syncMenu,
  'update-item-availability': updateItemAvailability,
  'update-order-status': updateOrderStatus,
  'webhook': webhook,
};

export default async function handler(req, res) {
  let route = req.query?.route;
  if (Array.isArray(route)) {
    route = route[route.length - 1];
  } else if (!route) {
    const urlParts = (req.url || '').split('?')[0].split('/').filter(Boolean);
    route = urlParts[urlParts.length - 1];
  }

  const selectedHandler = handlers[route];
  if (selectedHandler) {
    return selectedHandler(req, res);
  }

  return res.status(404).json({
    error: `Delivery endpoint not found: ${route}`,
    availableEndpoints: Object.keys(handlers),
  });
}
