export const EPIC_API_URL = 'https://graphql.epicgames.com/graphql';

export const GRAPHQL_QUERY = `query {
  Catalog {
    searchStore(allowCountries: \"US\", category: \"freegames\", count: 1000, country: \"US\", locale: \"en-US\", sortBy: \"effectiveDate\", sortDir: \"asc\") {
      elements {
        title
        id
        namespace
        description
        productSlug
        keyImages {
          type
          url
        }
        items {
          id
          namespace
        }
        promotions(category: \"freegames\") {
          promotionalOffers {
            promotionalOffers {
              startDate
              endDate
              discountSetting {
                discountType
                discountPercentage
              }
            }
          }
        }
      }
      paging {
        count
        total
      }
    }
  }
}`;
