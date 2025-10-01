# @midday/search

A comprehensive full-text search solution with support for multiple search engines, advanced query building, auto-complete, faceted search, and analytics.

## Features

- **Multi-Provider Support**: Elasticsearch, Algolia, Typesense, Local Search (Lunr.js)
- **Full-Text Search**: Advanced text search with relevance scoring
- **Auto-Complete**: Real-time search suggestions and typeahead
- **Faceted Search**: Filter results by categories, attributes, and ranges
- **Fuzzy Matching**: Handle typos and approximate matches
- **Geo Search**: Location-based search and filtering
- **Analytics**: Search analytics, popular queries, and performance metrics
- **Indexing**: Automatic document indexing with customizable mappings
- **Multi-Language**: Support for multiple languages and analyzers

## Installation

```bash
npm install @midday/search
```

## Quick Start

### Basic Search Setup

```typescript
import { SearchManager, ElasticsearchProvider } from "@midday/search";

// Initialize search provider
const elasticsearchProvider = new ElasticsearchProvider({
  node: "https://localhost:9200",
  auth: {
    username: "elastic",
    password: "password",
  },
});

const searchManager = new SearchManager(elasticsearchProvider, repository);

// Create search index
const index = await searchManager.createIndex({
  name: "products",
  settings: {
    numberOfShards: 1,
    numberOfReplicas: 0,
  },
  mappings: {
    properties: {
      title: { type: "text", analyzer: "standard" },
      description: { type: "text" },
      price: { type: "float" },
      category: { type: "keyword" },
      tags: { type: "keyword" },
      location: { type: "geo_point" },
      createdAt: { type: "date" },
    },
  },
});

// Index documents
await searchManager.indexDocument("products", {
  id: "1",
  title: "MacBook Pro 16-inch",
  description: "Powerful laptop for professionals",
  price: 2399.99,
  category: "laptops",
  tags: ["apple", "laptop", "professional"],
  location: { lat: 37.7749, lon: -122.4194 },
  createdAt: new Date(),
});

// Search documents
const results = await searchManager.search("products", {
  query: "MacBook",
  filters: {
    category: ["laptops"],
    price: { min: 1000, max: 3000 },
  },
  sort: [{ price: "asc" }],
  limit: 10,
});
```

### Advanced Query Building

```typescript
import { QueryBuilder } from "@midday/search";

const queryBuilder = new QueryBuilder();

// Build complex query
const query = queryBuilder
  .match("title", "MacBook Pro")
  .filter("category", ["laptops", "computers"])
  .range("price", { gte: 1000, lte: 3000 })
  .geoDistance("location", { lat: 37.7749, lon: -122.4194 }, "10km")
  .boost("tags", ["featured"], 2.0)
  .sort("price", "asc")
  .build();

// Execute query
const results = await searchManager.executeQuery("products", query);
```

### Auto-Complete

```typescript
// Setup auto-complete index
await searchManager.createIndex({
  name: "autocomplete",
  mappings: {
    properties: {
      suggest: {
        type: "completion",
        analyzer: "simple",
        preserve_separators: true,
        preserve_position_increments: true,
        max_input_length: 50,
      },
      title: { type: "text" },
      category: { type: "keyword" },
    },
  },
});

// Index suggestions
await searchManager.indexDocument("autocomplete", {
  id: "1",
  suggest: {
    input: ["MacBook Pro", "MacBook", "Apple MacBook"],
    weight: 10,
  },
  title: "MacBook Pro 16-inch",
  category: "laptops",
});

// Get suggestions
const suggestions = await searchManager.suggest("autocomplete", {
  text: "Mac",
  field: "suggest",
  size: 5,
});
```

### Faceted Search

```typescript
// Search with facets
const results = await searchManager.search("products", {
  query: "laptop",
  facets: {
    category: { terms: { field: "category" } },
    price_ranges: {
      range: {
        field: "price",
        ranges: [
          { to: 500 },
          { from: 500, to: 1000 },
          { from: 1000, to: 2000 },
          { from: 2000 },
        ],
      },
    },
    brands: { terms: { field: "brand.keyword" } },
  },
  limit: 20,
});

// Access facet results
console.log("Categories:", results.facets.category);
console.log("Price ranges:", results.facets.price_ranges);
console.log("Brands:", results.facets.brands);
```

### Search Analytics

```typescript
import { SearchAnalyzer } from "@midday/search";

const analyzer = new SearchAnalyzer(repository);

// Track search queries
await analyzer.trackQuery({
  query: "MacBook Pro",
  index: "products",
  userId: "user123",
  results: 25,
  clickedResult: "product-456",
  timestamp: new Date(),
});

// Get popular queries
const popularQueries = await analyzer.getPopularQueries({
  period: "7d",
  limit: 10,
});

// Get search analytics
const analytics = await analyzer.getAnalytics({
  index: "products",
  period: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
});

console.log(`Total searches: ${analytics.totalSearches}`);
console.log(`Average results: ${analytics.averageResults}`);
console.log(`Click-through rate: ${analytics.clickThroughRate}%`);
```

### Multiple Search Providers

```typescript
import { 
  SearchManager, 
  ElasticsearchProvider, 
  AlgoliaProvider 
} from "@midday/search";

// Use Elasticsearch for complex queries
const elasticsearchProvider = new ElasticsearchProvider({
  node: "https://localhost:9200",
});

// Use Algolia for fast auto-complete
const algoliaProvider = new AlgoliaProvider({
  appId: "your-app-id",
  apiKey: "your-api-key",
});

const mainSearch = new SearchManager(elasticsearchProvider, repository);
const autocompleteSearch = new SearchManager(algoliaProvider, repository);

// Use different providers for different use cases
const searchResults = await mainSearch.search("products", { query: "laptop" });
const suggestions = await autocompleteSearch.suggest("suggestions", { text: "lap" });
```

## API Reference

### SearchManager

Main class for search operations and index management.

#### Methods

- `createIndex(config)` - Create a new search index
- `deleteIndex(name)` - Delete an existing index
- `indexDocument(index, document)` - Index a single document
- `indexDocuments(index, documents)` - Index multiple documents
- `updateDocument(index, id, updates)` - Update existing document
- `deleteDocument(index, id)` - Delete document from index
- `search(index, query)` - Perform search query
- `suggest(index, config)` - Get search suggestions
- `executeQuery(index, query)` - Execute custom query
- `getDocument(index, id)` - Retrieve specific document

### QueryBuilder

Fluent interface for building complex search queries.

#### Methods

- `match(field, value, options?)` - Add match query
- `multiMatch(fields, value, options?)` - Add multi-match query
- `term(field, value)` - Add exact term match
- `terms(field, values)` - Add multiple term match
- `range(field, range)` - Add range query
- `exists(field)` - Check field existence
- `fuzzy(field, value, options?)` - Add fuzzy matching
- `wildcard(field, pattern)` - Add wildcard query
- `regexp(field, pattern)` - Add regex query
- `geoDistance(field, location, distance)` - Add geo distance query
- `filter(field, values)` - Add filter
- `sort(field, order)` - Add sorting
- `boost(field, values, boost)` - Add boosting
- `build()` - Build final query

### IndexManager

Manages search indices and mappings.

#### Methods

- `createIndex(config)` - Create search index with mappings
- `updateIndex(name, updates)` - Update index settings
- `getIndex(name)` - Get index configuration
- `listIndices()` - List all indices
- `reindex(source, destination, options?)` - Reindex documents
- `backup(index, destination)` - Backup index data
- `restore(index, source)` - Restore index from backup

### SearchAnalyzer

Provides search analytics and insights.

#### Methods

- `trackQuery(query)` - Track search query for analytics
- `getPopularQueries(options)` - Get most popular search queries
- `getAnalytics(options)` - Get comprehensive search analytics
- `getPerformanceMetrics(options)` - Get search performance metrics
- `getConversionMetrics(options)` - Get search conversion metrics
- `generateReport(options)` - Generate analytics report

## Provider Configuration

### Elasticsearch

```typescript
const elasticsearchProvider = new ElasticsearchProvider({
  node: "https://localhost:9200",
  auth: {
    username: "elastic",
    password: "password",
  },
  ssl: {
    rejectUnauthorized: false,
  },
  requestTimeout: 30000,
  maxRetries: 3,
});
```

### Algolia

```typescript
const algoliaProvider = new AlgoliaProvider({
  appId: "your-app-id",
  apiKey: "your-admin-api-key",
  searchKey: "your-search-only-key",
  options: {
    timeouts: {
      connect: 2000,
      read: 5000,
      write: 30000,
    },
  },
});
```

### Typesense

```typescript
const typesenseProvider = new TypesenseProvider({
  nodes: [
    {
      host: "localhost",
      port: 8108,
      protocol: "http",
    },
  ],
  apiKey: "your-api-key",
  connectionTimeoutSeconds: 2,
});
```

### Local Search (Lunr.js)

```typescript
const localProvider = new LocalSearchProvider({
  language: "en",
  stemming: true,
  stopwords: true,
  fields: ["title", "description", "content"],
  ref: "id",
});
```

## Search Query Options

### Basic Search

```typescript
const searchOptions = {
  query: "search term",
  fields: ["title", "description"],
  operator: "AND", // or "OR"
  fuzziness: "AUTO",
  boost: {
    title: 2.0,
    description: 1.0,
  },
  limit: 20,
  offset: 0,
};
```

### Advanced Filtering

```typescript
const advancedOptions = {
  query: "laptop",
  filters: {
    category: ["electronics", "computers"],
    price: { min: 500, max: 2000 },
    brand: ["apple", "dell", "hp"],
    inStock: true,
  },
  ranges: {
    rating: { gte: 4.0 },
    reviewCount: { gte: 10 },
  },
  geoFilter: {
    field: "store_location",
    center: { lat: 37.7749, lon: -122.4194 },
    radius: "25km",
  },
};
```

### Sorting and Pagination

```typescript
const sortingOptions = {
  query: "search term",
  sort: [
    { relevance: "desc" },
    { price: "asc" },
    { createdAt: "desc" },
  ],
  limit: 20,
  offset: 40, // Page 3 (0-based)
};
```

## Index Configuration

### Basic Index

```typescript
const indexConfig = {
  name: "products",
  settings: {
    numberOfShards: 1,
    numberOfReplicas: 0,
    analysis: {
      analyzer: {
        custom_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "stop"],
        },
      },
    },
  },
  mappings: {
    properties: {
      title: {
        type: "text",
        analyzer: "custom_analyzer",
        fields: {
          keyword: { type: "keyword" },
        },
      },
      price: { type: "float" },
      category: { type: "keyword" },
    },
  },
};
```

### Multi-Language Index

```typescript
const multiLangConfig = {
  name: "content",
  mappings: {
    properties: {
      title_en: { type: "text", analyzer: "english" },
      title_es: { type: "text", analyzer: "spanish" },
      title_fr: { type: "text", analyzer: "french" },
      content_en: { type: "text", analyzer: "english" },
      content_es: { type: "text", analyzer: "spanish" },
      content_fr: { type: "text", analyzer: "french" },
    },
  },
};
```

## Auto-Complete Configuration

### Completion Suggester

```typescript
const autocompleteConfig = {
  name: "suggestions",
  mappings: {
    properties: {
      suggest: {
        type: "completion",
        analyzer: "simple",
        preserve_separators: true,
        preserve_position_increments: true,
        max_input_length: 50,
        contexts: [
          {
            name: "category",
            type: "category",
          },
        ],
      },
    },
  },
};

// Index with context
await searchManager.indexDocument("suggestions", {
  id: "1",
  suggest: {
    input: ["MacBook Pro 16-inch"],
    weight: 10,
    contexts: {
      category: ["laptops", "apple"],
    },
  },
});

// Suggest with context
const suggestions = await searchManager.suggest("suggestions", {
  text: "Mac",
  field: "suggest",
  contexts: {
    category: "laptops",
  },
});
```

## Performance Optimization

### Bulk Operations

```typescript
// Bulk index documents
const documents = [
  { id: "1", title: "Product 1", price: 100 },
  { id: "2", title: "Product 2", price: 200 },
  { id: "3", title: "Product 3", price: 300 },
];

await searchManager.indexDocuments("products", documents);

// Bulk delete
await searchManager.deleteDocuments("products", ["1", "2", "3"]);
```

### Search Result Caching

```typescript
const searchWithCache = async (query: string) => {
  const cacheKey = `search:${JSON.stringify(query)}`;
  
  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  // Perform search
  const results = await searchManager.search("products", { query });
  
  // Cache results for 5 minutes
  await cache.set(cacheKey, results, 300);
  
  return results;
};
```

## Error Handling

```typescript
import { 
  SearchError, 
  IndexNotFoundError, 
  QueryError 
} from "@midday/search";

try {
  const results = await searchManager.search("products", { query: "laptop" });
} catch (error) {
  if (error instanceof IndexNotFoundError) {
    console.error("Index does not exist:", error.indexName);
  } else if (error instanceof QueryError) {
    console.error("Invalid query:", error.query);
  } else if (error instanceof SearchError) {
    console.error("Search error:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## Testing

```bash
npm test
```

## License

Private package for Midday platform.