import { useState } from 'react';
import * as THREE from 'three';
import { ImageUpload } from '@/types/canvas';

export function useModel3DLoader() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModel = async (modelData: ImageUpload): Promise<THREE.Group | null> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!modelData.file) {
        throw new Error('No file provided');
      }

      if (!modelData.url) {
        throw new Error('No URL provided');
      }

      const fileExtension = modelData.file.name.toLowerCase().split('.').pop();
      let model: THREE.Group | null = null;

      if (fileExtension === 'obj') {
        // Load OBJ file
        const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
        const loader = new OBJLoader();
        
        const text = await fetch(modelData.url).then(res => res.text());
        model = loader.parse(text);
      } else if (fileExtension === 'fbx') {
        // Load FBX file
        const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
        const loader = new FBXLoader();
        
        const result = await loader.loadAsync(modelData.url);
        model = result;
      } else if (fileExtension === 'gltf' || fileExtension === 'glb') {
        // Load GLTF/GLB file
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { LoadingManager } = await import('three');
        
        // Create a custom loading manager to handle blob URLs and dependencies
        const manager = new LoadingManager();
        
        // Get related files map if available
        const relatedFiles = modelData.relatedFiles || new Map();
        
        // Custom resolver for external resources
        manager.setURLModifier((url: string) => {
          // If it's already a blob URL or absolute URL, use it as-is
          if (url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
            return url;
          }
          
          // Extract filename from path (handle paths like "textures/image.png" or "scene.bin")
          const fileName = url.split('/').pop() || url;
          const normalizedUrl = url.replace(/\\/g, '/'); // Normalize path separators
          
          // Try to find the file in related files map
          // First try exact match with full path
          if (relatedFiles.has(normalizedUrl)) {
            return relatedFiles.get(normalizedUrl)!.url;
          }
          
          // Try exact filename match
          if (relatedFiles.has(fileName)) {
            return relatedFiles.get(fileName)!.url;
          }
          
          // Try to find by filename (case-insensitive, partial match)
          const lowerFileName = fileName.toLowerCase();
          for (const [key, value] of relatedFiles.entries()) {
            const lowerKey = key.toLowerCase();
            // Match if key ends with filename or contains it
            if (lowerKey === lowerFileName || 
                lowerKey.endsWith('/' + lowerFileName) ||
                lowerKey.endsWith('\\' + lowerFileName) ||
                lowerKey.includes(lowerFileName)) {
              return value.url;
            }
          }
          
          // Try to match by filename without extension or with different case
          const fileNameWithoutExt = fileName.split('.').slice(0, -1).join('.');
          if (fileNameWithoutExt) {
            for (const [key, value] of relatedFiles.entries()) {
              const lowerKey = key.toLowerCase();
              if (lowerKey.includes(fileNameWithoutExt.toLowerCase())) {
                return value.url;
              }
            }
          }
          
          // If not found in related files, return original URL
          // The loader will fail, but we'll catch it and show a helpful error
          console.warn('[GLTFLoader] Could not resolve dependency:', url, 'Available files:', Array.from(relatedFiles.keys()));
          return url;
        });
        
        const loader = new GLTFLoader(manager);
        
        // For GLB files (binary), they're self-contained and should work
        if (fileExtension === 'glb') {
          const result = await loader.loadAsync(modelData.url);
          model = result.scene;
        } else {
          // For GLTF files, try to load and handle missing dependencies gracefully
          try {
            const result = await loader.loadAsync(modelData.url);
            model = result.scene;
          } catch (gltfError: any) {
            // If it's a missing dependency error, provide helpful message
            if (gltfError.message?.includes('Failed to load') || 
                gltfError.message?.includes('buffer') ||
                gltfError.message?.includes('texture') ||
                gltfError.message?.includes('ERR_FILE_NOT_FOUND')) {
              throw new Error(
                'GLTF file requires external files (.bin, textures). ' +
                'Please upload all related files together, or use a GLB file (self-contained). ' +
                'Tip: Select multiple files (GLTF + .bin + textures) when uploading.'
              );
            }
            throw gltfError;
          }
        }
      } else if (fileExtension === 'mb' || fileExtension === 'ma') {
        // Maya files (MB/MA) are proprietary and not directly loadable in browser
        throw new Error(
          'Maya files (.mb/.ma) are not directly supported. ' +
          'Please export your model to a supported format: FBX, GLTF/GLB, or OBJ.'
        );
      } else {
        throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: OBJ, FBX, GLTF, GLB`);
      }

      if (!model) {
        throw new Error('Failed to load model');
      }

      // Calculate bounding box to center and scale model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim; // Scale to fit in view

      model.scale.multiplyScalar(scale);
      model.position.sub(center.multiplyScalar(scale));

      setIsLoading(false);
      return model;
    } catch (err) {
      console.error('Error loading 3D model:', err);
      setError(err instanceof Error ? err.message : 'Failed to load model');
      setIsLoading(false);
      return null;
    }
  };

  return { loadModel, isLoading, error, setIsLoading, setError };
}

