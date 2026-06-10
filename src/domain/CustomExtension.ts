export type CustomExtensionType = 'script' | 'module' | 'eval';

/**
 * Custom Extension Definition
 * Allows users to add their own extensions (including local development ones).
 */
export interface CustomExtension {
  id: string;                       // Unique ID for the custom extension
  name: string;                     // Display name
  description: string;              // Description
  author: string;                   // Author name
  sourceUrl: string;                // URL to the extension script
  type: CustomExtensionType;        // Script type
  icon?: string;                    // Optional icon URL
  repository?: string;              // Optional repository URL
  website?: string;                 // Optional website URL
  tags?: string[];                  // Optional tags
  createdAt: number;                // Timestamp when added
  updatedAt: number;                // Timestamp when last updated
}
