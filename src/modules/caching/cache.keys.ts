export const CacheKeys = {
  restaurantList: (queryString = "default") => `foodflow:restaurants:list:${queryString}`,

  restaurantDetail: (restaurantId: string) =>
    `foodflow:restaurants:detail:${restaurantId}`,

  restaurantMenu: (restaurantId: string) => `foodflow:restaurants:menu:${restaurantId}`,

  publicConfig: () => "foodflow:config:public",

  restaurantPattern: (restaurantId: string) => `foodflow:restaurants:*:${restaurantId}*`,

  allRestaurantsPattern: () => "foodflow:restaurants:*",
};

export const CacheTTL = {
  RESTAURANT_LIST: 300, // 5 minutes
  RESTAURANT_DETAIL: 600, // 10 minutes
  RESTAURANT_MENU: 600, // 10 minutes
  PUBLIC_CONFIG: 3600, // 1 hour
};
