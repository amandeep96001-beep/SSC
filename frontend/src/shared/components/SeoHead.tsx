import { Helmet } from 'react-helmet-async';
import {
  APP_NAME,
  APP_TAGLINE,
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_TITLE,
  SEO_KEYWORDS,
  SITE_URL,
  absoluteUrl,
  pageTitle,
} from '@/shared/brand';

type SeoHeadProps = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
};

function buildJsonLd() {
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'SoftwareApplication',
      name: APP_NAME,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
      description: SEO_DEFAULT_DESCRIPTION,
      about: [
        'SSC CGL',
        'SSC CHSL',
        'SSC GD',
        'SSC CPO',
        'Banking exams',
        'Railways NTPC',
      ],
      slogan: APP_TAGLINE,
      inLanguage: 'en-IN',
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: 'student',
      },
    },
    {
      '@type': 'Organization',
      name: APP_NAME,
      logo: absoluteUrl('/logo.png'),
    },
  ];

  if (SITE_URL) {
    graph.unshift({
      '@type': 'WebSite',
      name: APP_NAME,
      url: SITE_URL,
      description: SEO_DEFAULT_DESCRIPTION,
      inLanguage: 'en-IN',
    });
    (graph[1] as Record<string, unknown>).url = SITE_URL;
    (graph[2] as Record<string, unknown>).url = SITE_URL;
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

/** Global SEO head. Set VITE_SITE_URL after domain + hosting are live. */
export function SeoHead({
  title,
  description = SEO_DEFAULT_DESCRIPTION,
  path = '/',
  noIndex = false,
  image = '/logo-lockup.png',
}: SeoHeadProps) {
  const fullTitle = title ? pageTitle(title) : SEO_DEFAULT_TITLE;
  const canonical = absoluteUrl(path);
  const ogImage = image.startsWith('http') ? image : absoluteUrl(image);
  const robots = noIndex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1';

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en-IN" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={SEO_KEYWORDS} />
      <meta name="author" content={APP_NAME} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <meta name="application-name" content={APP_NAME} />
      <meta name="apple-mobile-web-app-title" content={APP_NAME} />
      <meta name="theme-color" content="#12162a" />
      <meta name="format-detection" content="telephone=no" />
      {SITE_URL ? <link rel="canonical" href={canonical} /> : null}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={APP_NAME} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {SITE_URL ? <meta property="og:url" content={canonical} /> : null}
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${APP_NAME} — SSC exam preparation`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      <script type="application/ld+json">{JSON.stringify(buildJsonLd())}</script>
    </Helmet>
  );
}

export default SeoHead;
