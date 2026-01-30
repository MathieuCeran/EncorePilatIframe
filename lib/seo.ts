const config = {
  appName: "Your App Name",
  appDescription: "Your app description goes here.",
  domainName: "yourdomain.com",
};

// Types for SEO fields
export interface OpenGraphProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
}

export interface SEOTagsOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  openGraph?: OpenGraphProps;
  canonicalUrlRelative?: string;
}

export interface SEOTags {
  title: string;
  description: string;
  keywords: string[];
  applicationName: string;
  metadataBase: URL;
  openGraph: {
    title: string;
    description: string;
    url: string;
    siteName: string;
    locale: string;
    type: string;
    // images?: { url: string; width: number; height: number }[];
  };
  twitter: {
    title: string;
    description: string;
    // images?: string[];
    card: string;
    creator: string;
  };
  alternates?: { canonical: string };
  [key: string]:
    | string
    | string[]
    | URL
    | {
        title: string;
        description: string;
        url: string;
        siteName: string;
        locale: string;
        type: string;
      }
    | {
        title: string;
        description: string;
        card: string;
        creator: string;
      }
    | {
        canonical: string;
      }
    | undefined;
}

// Main SEO tags generator
export const getSEOTags = ({
  title,
  description,
  keywords,
  openGraph,
  canonicalUrlRelative,
}: SEOTagsOptions = {}): SEOTags => {
  return {
    title: title || config.appName,
    description: description || config.appDescription,
    keywords: keywords || [config.appName],
    applicationName: config.appName,
    metadataBase: new URL(
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000/"
        : `https://${config.domainName}/`
    ),
    openGraph: {
      title: openGraph?.title || config.appName,
      description: openGraph?.description || config.appDescription,
      url: openGraph?.url || `https://${config.domainName}/`,
      siteName: openGraph?.title || config.appName,
      // images: openGraph?.image ? [{ url: openGraph.image, width: 1200, height: 660 }] : undefined,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      title: openGraph?.title || config.appName,
      description: openGraph?.description || config.appDescription,
      // images: openGraph?.image ? [openGraph.image] : undefined,
      card: "summary_large_image",
      creator: "@aymenkadri",
    },
    ...(canonicalUrlRelative && {
      alternates: { canonical: canonicalUrlRelative },
    }),
  };
};

// // Structured Data for Rich Results (JSON-LD)
// import React from "react";

// export const renderSchemaTags = (): React.JSX.Element => (
//   <script
//     type="application/ld+json"
//     dangerouslySetInnerHTML={{
//       __html: JSON.stringify({
//         "@context": "http://schema.org",
//         "@type": "SoftwareApplication",
//         name: config.appName,
//         description: config.appDescription,
//         image: `https://${config.domainName}/icon.png`,
//         url: `https://${config.domainName}/`,
//         author: {
//           "@type": "Person",
//           name: "Marc Lou",
//         },
//         datePublished: "2023-08-01",
//         applicationCategory: "EducationalApplication",
//         aggregateRating: {
//           "@type": "AggregateRating",
//           ratingValue: "4.8",
//           ratingCount: "12",
//         },
//         offers: [
//           {
//             "@type": "Offer",
//             price: "9.00",
//             priceCurrency: "USD",
//           },
//         ],
//       }),
//     }}
//   />
// );
