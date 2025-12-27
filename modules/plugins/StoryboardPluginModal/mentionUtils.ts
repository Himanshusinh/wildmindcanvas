/**
 * Utility functions for parsing @mentions and resolving them to reference images
 */

/**
 * Parse @mentions from text (e.g., "@character1", "@background", "@props")
 * Returns an array of unique mention names (without the @ symbol)
 */
export function parseMentions(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Match @mentions - word characters after @, case-insensitive
  const mentionRegex = /@(\w+)/gi;
  const matches = text.matchAll(mentionRegex);
  const mentions = new Set<string>();

  for (const match of matches) {
    if (match[1]) {
      mentions.add(match[1].toLowerCase()); // Normalize to lowercase for matching
    }
  }

  return Array.from(mentions);
}

/**
 * Resolve @mentions to reference image URLs
 * 
 * @param mentions - Array of mention names (without @)
 * @param characterNamesMap - Map of character index to name
 * @param backgroundNamesMap - Map of background index to name
 * @param propsNamesMap - Map of props index to name
 * @param connectedCharacterImages - Array of connected character image URLs
 * @param connectedBackgroundImages - Array of connected background image URLs
 * @param connectedPropsImages - Array of connected props image URLs
 * @returns Array of reference image URLs
 */
export function resolveMentionsToImages(params: {
  mentions: string[];
  characterNamesMap: Record<number, string>;
  backgroundNamesMap: Record<number, string>;
  propsNamesMap: Record<number, string>;
  connectedCharacterImages: string[];
  connectedBackgroundImages: string[];
  connectedPropsImages: string[];
}): string[] {
  const {
    mentions,
    characterNamesMap,
    backgroundNamesMap,
    propsNamesMap,
    connectedCharacterImages,
    connectedBackgroundImages,
    connectedPropsImages,
  } = params;

  const referenceImages: string[] = [];

  // Helper to find image by name (case-insensitive)
  const findImageByName = (
    name: string,
    namesMap: Record<number, string>,
    images: string[]
  ): string | null => {
    const normalizedName = name.toLowerCase();
    
    // Find the index where the name matches
    for (const [indexStr, mappedName] of Object.entries(namesMap)) {
      if (mappedName && mappedName.toLowerCase() === normalizedName) {
        const index = parseInt(indexStr, 10);
        if (index >= 0 && index < images.length) {
          return images[index];
        }
      }
    }
    return null;
  };

  // Resolve each mention
  for (const mention of mentions) {
    // Try character images first
    const characterImage = findImageByName(
      mention,
      characterNamesMap,
      connectedCharacterImages
    );
    if (characterImage) {
      referenceImages.push(characterImage);
      continue;
    }

    // Try background images
    const backgroundImage = findImageByName(
      mention,
      backgroundNamesMap,
      connectedBackgroundImages
    );
    if (backgroundImage) {
      referenceImages.push(backgroundImage);
      continue;
    }

    // Try props images
    const propsImage = findImageByName(
      mention,
      propsNamesMap,
      connectedPropsImages
    );
    if (propsImage) {
      referenceImages.push(propsImage);
    }
  }

  // Remove duplicates while preserving order
  return Array.from(new Set(referenceImages));
}

/**
 * Get all reference images for a given text (script, scene, etc.)
 * This is the main function to use when generating images
 */
export function getReferenceImagesForText(params: {
  text: string;
  characterNamesMap: Record<number, string>;
  backgroundNamesMap: Record<number, string>;
  propsNamesMap: Record<number, string>;
  connectedCharacterImages: string[];
  connectedBackgroundImages: string[];
  connectedPropsImages: string[];
}): string[] {
  const mentions = parseMentions(params.text);
  
  if (mentions.length === 0) {
    return [];
  }

  return resolveMentionsToImages({
    mentions,
    characterNamesMap: params.characterNamesMap,
    backgroundNamesMap: params.backgroundNamesMap,
    propsNamesMap: params.propsNamesMap,
    connectedCharacterImages: params.connectedCharacterImages,
    connectedBackgroundImages: params.connectedBackgroundImages,
    connectedPropsImages: params.connectedPropsImages,
  });
}

/**
 * Build a map of name -> image URL for all named images in the storyboard
 * This creates a lookup table: "Aryan" -> imageUrl, "Restaurant" -> imageUrl, etc.
 * 
 * If namedImages object is provided (from snapshot), use it directly for faster lookup.
 * Otherwise, build it from names maps + connected images.
 */
export function buildNamedImagesMap(params: {
  characterNamesMap: Record<number, string>;
  backgroundNamesMap: Record<number, string>;
  propsNamesMap: Record<number, string>;
  connectedCharacterImages: string[];
  connectedBackgroundImages: string[];
  connectedPropsImages: string[];
  namedImages?: {
    characters?: Record<string, string>;
    backgrounds?: Record<string, string>;
    props?: Record<string, string>;
  };
}): {
  characterMap: Record<string, string>; // name -> imageUrl
  backgroundMap: Record<string, string>; // name -> imageUrl
  propsMap: Record<string, string>; // name -> imageUrl
} {
  const { characterNamesMap, backgroundNamesMap, propsNamesMap, connectedCharacterImages, connectedBackgroundImages, connectedPropsImages, namedImages } = params;

  // If namedImages object exists (from snapshot), use it directly - it's already built!
  if (namedImages) {
    return {
      characterMap: namedImages.characters || {},
      backgroundMap: namedImages.backgrounds || {},
      propsMap: namedImages.props || {},
    };
  }

  // Otherwise, build from names maps + connected images
  const characterMap: Record<string, string> = {};
  const backgroundMap: Record<string, string> = {};
  const propsMap: Record<string, string> = {};

  // Build character name -> image URL map
  Object.entries(characterNamesMap).forEach(([indexStr, name]) => {
    if (name && name.trim()) {
      const index = parseInt(indexStr, 10);
      if (index >= 0 && index < connectedCharacterImages.length && connectedCharacterImages[index]) {
        const normalizedName = name.toLowerCase();
        characterMap[normalizedName] = connectedCharacterImages[index];
      }
    }
  });

  // Build background name -> image URL map
  Object.entries(backgroundNamesMap).forEach(([indexStr, name]) => {
    if (name && name.trim()) {
      const index = parseInt(indexStr, 10);
      if (index >= 0 && index < connectedBackgroundImages.length && connectedBackgroundImages[index]) {
        const normalizedName = name.toLowerCase();
        backgroundMap[normalizedName] = connectedBackgroundImages[index];
      }
    }
  });

  // Build props name -> image URL map
  Object.entries(propsNamesMap).forEach(([indexStr, name]) => {
    if (name && name.trim()) {
      const index = parseInt(indexStr, 10);
      if (index >= 0 && index < connectedPropsImages.length && connectedPropsImages[index]) {
        const normalizedName = name.toLowerCase();
        propsMap[normalizedName] = connectedPropsImages[index];
      }
    }
  });

  console.log('[buildNamedImagesMap] Built maps:', {
    characters: Object.keys(characterMap).length,
    backgrounds: Object.keys(backgroundMap).length,
    props: Object.keys(propsMap).length,
    characterNames: Object.keys(characterMap),
    backgroundNames: Object.keys(backgroundMap),
    propsNames: Object.keys(propsMap),
  });

  return { characterMap, backgroundMap, propsMap };
}

/**
 * Get reference images based on story world character/location IDs
 * Maps character/location names from story world to named images
 */
export function getReferenceImagesFromStoryWorld(params: {
  characterIds?: string[];
  locationId?: string;
  storyWorld: {
    characters: Array<{ id: string; name: string }>;
    locations: Array<{ id: string; name: string }>;
  };
  characterNamesMap: Record<number, string>;
  backgroundNamesMap: Record<number, string>;
  propsNamesMap: Record<number, string>;
  connectedCharacterImages: string[];
  connectedBackgroundImages: string[];
  connectedPropsImages: string[];
  namedImages?: {
    characters?: Record<string, string>;
    backgrounds?: Record<string, string>;
    props?: Record<string, string>;
  };
}): string[] {
  const {
    characterIds = [],
    locationId,
    storyWorld,
    characterNamesMap,
    backgroundNamesMap,
    propsNamesMap,
    connectedCharacterImages,
    connectedBackgroundImages,
    connectedPropsImages,
    namedImages,
  } = params;

  // Build named images map first (name -> imageUrl lookup)
  // Use pre-built namedImages from snapshot if available, otherwise build from maps
  const { characterMap, backgroundMap, propsMap } = buildNamedImagesMap({
    characterNamesMap,
    backgroundNamesMap,
    propsNamesMap,
    connectedCharacterImages,
    connectedBackgroundImages,
    connectedPropsImages,
    namedImages, // Pass through namedImages from snapshot
  });

  const referenceImages: string[] = [];

  console.log('[getReferenceImagesFromStoryWorld] Starting mapping:', {
    characterIds,
    locationId,
    characterNames: storyWorld.characters.map(c => c.name),
    locationNames: storyWorld.locations.map(l => l.name),
    characterNamesMap,
    backgroundNamesMap,
    connectedCharacterImagesCount: connectedCharacterImages.length,
    connectedBackgroundImagesCount: connectedBackgroundImages.length,
  });

  // Map character IDs to character names, then to reference images using the named images map
  characterIds.forEach(charId => {
    const character = storyWorld.characters.find(c => c.id === charId);
    if (character) {
      const charName = character.name.toLowerCase().trim();
      console.log(`[getReferenceImagesFromStoryWorld] Looking for character: "${character.name}" (normalized: "${charName}")`);
      
      // Try exact match first
      let charImage = characterMap[charName];
      
      // If not found, try fuzzy matching (case-insensitive, trim whitespace)
      if (!charImage) {
        for (const [mapName, imageUrl] of Object.entries(characterMap)) {
          const normalizedMapName = mapName.toLowerCase().trim();
          if (normalizedMapName === charName || 
              normalizedMapName.includes(charName) || 
              charName.includes(normalizedMapName)) {
            charImage = imageUrl;
            console.log(`[getReferenceImagesFromStoryWorld] ✅ Found fuzzy match: "${character.name}" matches "${mapName}"`);
            break;
          }
        }
      }
      
      if (charImage) {
        console.log(`[getReferenceImagesFromStoryWorld] ✅ Found reference image for "${character.name}": ${charImage.substring(0, 50)}...`);
        referenceImages.push(charImage);
      } else {
        console.warn(`[getReferenceImagesFromStoryWorld] ❌ No reference image found for "${character.name}". Available character names:`, Object.keys(characterMap));
        // DO NOT use fallback - we want to ensure correct image matching
      }
    } else {
      console.warn(`[getReferenceImagesFromStoryWorld] Character with ID "${charId}" not found in story world`);
    }
  });

  // Map location ID to location name, then to reference image using the named images map
  if (locationId) {
    const location = storyWorld.locations.find(l => l.id === locationId);
    if (location) {
      const locName = location.name.toLowerCase();
      console.log(`[getReferenceImagesFromStoryWorld] Looking for location: "${location.name}" (normalized: "${locName}")`);
      
      // Use the named images map for direct lookup
      const locImage = backgroundMap[locName];
      
      if (locImage) {
        console.log(`[getReferenceImagesFromStoryWorld] ✅ Found reference image for "${location.name}": ${locImage.substring(0, 50)}...`);
        referenceImages.push(locImage);
      } else {
        console.warn(`[getReferenceImagesFromStoryWorld] ❌ No reference image found for "${location.name}". Available background names:`, Object.keys(backgroundMap));
      }
    } else {
      console.warn(`[getReferenceImagesFromStoryWorld] Location with ID "${locationId}" not found in story world`);
    }
  }

  // FALLBACK: Only use if we have character/location IDs but no matched images
  // This should rarely happen if characterNamesMap is set up correctly
  if (referenceImages.length === 0 && (characterIds.length > 0 || locationId)) {
    console.warn('[getReferenceImagesFromStoryWorld] ⚠️ No images found by name matching. This may indicate a mismatch between character names and characterNamesMap.');
    console.warn('[getReferenceImagesFromStoryWorld] Available character names in map:', Object.keys(characterMap));
    console.warn('[getReferenceImagesFromStoryWorld] Character IDs in scene:', characterIds);
    console.warn('[getReferenceImagesFromStoryWorld] Character names from story world:', characterIds.map(id => {
      const char = storyWorld.characters.find(c => c.id === id);
      return char ? char.name : id;
    }));
    // DO NOT use random fallback images - this would use wrong images
    // Instead, log the issue so it can be debugged
  }

  console.log(`[getReferenceImagesFromStoryWorld] Final reference images: ${referenceImages.length} images found`);

  // Remove duplicates while preserving order
  return Array.from(new Set(referenceImages));
}

