export const EPIC_API_URL = 'https://graphql.epicgames.com/graphql';

export const GRAPHQL_QUERY = `query {
  Catalog {
    catalogOffers(
      namespace: \"epic\",
      locale: \"en-GB\",
      params: {
        category: \"freegames\",
        country: \"GB\",
        sortBy: \"effectiveDate\",
        sortDir: \"asc\"
      }) {
        elements {
          title
          keyImages {
            type
            url
          }
          productSlug
          promotions {
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
            upcomingPromotionalOffers {
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
      }
    }
  }`;
