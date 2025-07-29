import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  noindex?: boolean
}

export default function SEO({
  title = 'Nutrivize - Smart Nutrition Tracker & AI Meal Planner | Official Nutrivize App',
  description = 'Nutrivize: Smart nutrition tracking and AI-powered meal planning. Track calories, macros, and nutrients. Get personalized meal suggestions and achieve your health goals with the official Nutrivize app.',
  keywords = 'nutrivize, nutrivize app, nutrivize nutrition tracker, nutrivize meal planner, nutrition tracker, calorie counter, meal planning, diet app, health app, food diary, macro tracker, nutrition app, AI meal planner, healthy eating',
  image = 'https://nutrivize.app/icons/icon-512x512.png',
  url = 'https://nutrivize.app',
  type = 'website',
  noindex = false
}: SEOProps) {
  const fullTitle = title.includes('Nutrivize') ? title : `${title} | Nutrivize`
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Nutrivize" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta name="twitter:site" content="@nutrivize" />
      <meta name="twitter:creator" content="@nutrivize" />
      
      {/* Additional SEO tags */}
      <meta name="author" content="Nutrivize" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Nutrivize",
          "applicationCategory": "HealthApplication",
          "operatingSystem": "Web, iOS, Android",
          "description": description,
          "url": url,
          "image": image,
          "author": {
            "@type": "Organization",
            "name": "Nutrivize",
            "url": "https://nutrivize.app"
          },
          "brand": {
            "@type": "Brand",
            "name": "Nutrivize"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Nutrivize",
            "url": "https://nutrivize.app"
          },
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "1250"
          },
          "featureList": [
            "Nutrition Tracking with Nutrivize",
            "Calorie Counter", 
            "AI Meal Planning",
            "Food Database",
            "Progress Analytics",
            "Goal Setting",
            "Restaurant AI Assistant"
          ],
          "alternateName": ["Nutrivize App", "Nutrivize Nutrition Tracker", "Nutrivize Meal Planner"]
        })}
      </script>
    </Helmet>
  )
}
