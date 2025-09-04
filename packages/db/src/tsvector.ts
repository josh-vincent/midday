// Define tsvector as a custom PostgreSQL type for full-text search
// This is defined in a separate file to avoid circular dependencies

import { customType } from "drizzle-orm/pg-core";

// Create the tsvector custom type properly
export const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export default tsvector;
