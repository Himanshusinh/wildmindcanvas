// Lightweight smart selection utilities: edge map + superpixel-lite + flood fill
// Produces a binary mask and its tight bounding box for a given marquee region.

export interface SmartSelectResult {
  mask: Uint8Array; // 1 for selected, 0 otherwise, row-major within region
  width: number;
  height: number;
  bbox: { x: number; y: number; width: number; height: number } | null; // relative to region
}

// Compute gradient magnitude using Sobel operator on single-channel luminance
function computeEdgeMap(data: Uint8ClampedArray, w: number, h: number): Float32Array {
  const edge = new Float32Array(w * h);
  const idx = (x: number, y: number) => (y * w + x);
  const lum = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y) * 4;
      // Simple luminance
      lum[idx(x, y)] = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    }
  }
  const sx = [[-1,0,1],[-2,0,2],[-1,0,1]];
  const sy = [[-1,-2,-1],[0,0,0],[1,2,1]];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let gx = 0, gy = 0;
      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          const v = lum[idx(x + i, y + j)];
          gx += v * sx[j + 1][i + 1];
          gy += v * sy[j + 1][i + 1];
        }
      }
      edge[idx(x, y)] = Math.hypot(gx, gy);
    }
  }
  return edge;
}

// Simple SLIC-like clustering: grid seeds then k-means on color + position for a few iterations
function superpixelSegments(data: Uint8ClampedArray, w: number, h: number, targetCount = 300): Uint16Array {
  const S = Math.max(8, Math.floor(Math.sqrt((w * h) / targetCount))); // grid step
  const seeds: Array<{x:number;y:number;r:number;g:number;b:number}> = [];
  for (let y = S/2; y < h; y += S) {
    for (let x = S/2; x < w; x += S) {
      const i = (Math.floor(y) * w + Math.floor(x)) * 4;
      seeds.push({ x: Math.floor(x), y: Math.floor(y), r: data[i], g: data[i+1], b: data[i+2] });
    }
  }
  const K = seeds.length;
  const labels = new Uint16Array(w * h);
  const cx = new Float32Array(K), cy = new Float32Array(K), cr = new Float32Array(K), cg = new Float32Array(K), cb = new Float32Array(K), count = new Uint32Array(K);
  const iter = 3; // few iterations for speed
  for (let it = 0; it < iter; it++) {
    // assign
    for (let k = 0; k < K; k++) { count[k] = 0; cx[k] = 0; cy[k] = 0; cr[k] = 0; cg[k] = 0; cb[k] = 0; }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        let bestK = 0; let bestD = Infinity;
        for (let k = 0; k < K; k++) {
          const dx = x - seeds[k].x; const dy = y - seeds[k].y;
          const dr = data[i] - seeds[k].r; const dg = data[i+1] - seeds[k].g; const db = data[i+2] - seeds[k].b;
          // weight color more than position for tightness
          const d = dr*dr + dg*dg + db*db + 0.25*(dx*dx + dy*dy);
          if (d < bestD) { bestD = d; bestK = k; }
        }
        labels[y * w + x] = bestK as number;
        count[bestK]++; cx[bestK] += x; cy[bestK] += y; cr[bestK] += data[i]; cg[bestK] += data[i+1]; cb[bestK] += data[i+2];
      }
    }
    // update seeds
    for (let k = 0; k < K; k++) {
      const c = Math.max(1, count[k]);
      seeds[k].x = Math.round(cx[k] / c);
      seeds[k].y = Math.round(cy[k] / c);
      seeds[k].r = Math.round(cr[k] / c);
      seeds[k].g = Math.round(cg[k] / c);
      seeds[k].b = Math.round(cb[k] / c);
    }
  }
  return labels;
}

// LAB distance helper (approximate RGB->LAB for tolerance decisions)
function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const srgb = (v: number) => v/255;
  const lin = (v: number) => v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  let R = lin(srgb(r)), G = lin(srgb(g)), B = lin(srgb(b));
  const X = R*0.4124 + G*0.3576 + B*0.1805;
  const Y = R*0.2126 + G*0.7152 + B*0.0722;
  const Z = R*0.0193 + G*0.1192 + B*0.9505;
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : (7.787*t + 16/116);
  const fx = f(X/0.95047), fy = f(Y/1.0), fz = f(Z/1.08883);
  const L = 116*fy - 16, a = 500*(fx - fy), b2 = 200*(fy - fz);
  return [L,a,b2];
}

export function smartSelectRegion(imageData: ImageData): SmartSelectResult {
  const { data, width: w, height: h } = imageData;
  const edge = computeEdgeMap(data, w, h);
  const labels = superpixelSegments(data, w, h);

  // Build superpixel descriptors (mean LAB, variance)
  const K = (labels.reduce((max, v) => Math.max(max, v), 0) + 1) || 1;
  const sumL = new Float32Array(K), sumA = new Float32Array(K), sumB = new Float32Array(K);
  const cnt = new Uint32Array(K);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = labels[y*w + x];
      const i = (y*w + x) * 4;
      const [L,A,B] = rgbToLab(data[i], data[i+1], data[i+2]);
      sumL[k] += L; sumA[k] += A; sumB[k] += B; cnt[k]++;
    }
  }
  const meanL = new Float32Array(K), meanA = new Float32Array(K), meanB = new Float32Array(K);
  for (let k = 0; k < K; k++) {
    const c = Math.max(1, cnt[k]);
    meanL[k] = sumL[k]/c; meanA[k] = sumA[k]/c; meanB[k] = sumB[k]/c;
  }

  // Seed: region center
  const seedX = Math.floor(w / 2), seedY = Math.floor(h / 2);
  const seedK = labels[seedY * w + seedX];
  const ref: [number, number, number] = [meanL[seedK], meanA[seedK], meanB[seedK]];

  // Flood over superpixels with adaptive tolerance and edge resistance
  const mask = new Uint8Array(w * h);
  const visitedK = new Uint8Array(K);
  const queue: number[] = [seedK];
  visitedK[seedK] = 1;
  const baseTol = 18; // LAB distance base tolerance
  const edgeThresh = 35; // gradient threshold
  while (queue.length) {
    const k = queue.pop() as number;
    // include all pixels of this superpixel
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (labels[y*w + x] === k) {
          const e = edge[y*w + x];
          if (e < edgeThresh) {
            mask[y*w + x] = 1;
          }
        }
      }
    }
    // explore neighbors: naive adjacency by proximity in centroid space
    // find neighbor ids within radius S around seed centroid
    for (let n = 0; n < K; n++) {
      if (visitedK[n]) continue;
      const dLab = Math.hypot(meanL[n]-ref[0], meanA[n]-ref[1], meanB[n]-ref[2]);
      if (dLab <= baseTol) {
        visitedK[n] = 1;
        queue.push(n);
      }
    }
  }

  // Morphological closing to smooth mask (3x3)
  const closed = mask.slice();
  const idx = (x:number,y:number)=> y*w + x;
  // dilation
  const dil = mask.slice();
  for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
    let v = 0;
    for (let j=-1;j<=1;j++) for(let i=-1;i<=1;i++) v = v || mask[idx(x+i,y+j)];
    dil[idx(x,y)] = v as number;
  }
  // erosion
  for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
    let v = 1;
    for (let j=-1;j<=1;j++) for(let i=-1;i<=1;i++) v = v && dil[idx(x+i,y+j)] ? 1 : 0;
    closed[idx(x,y)] = v as number;
  }

  // Bounding box
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (closed[idx(x,y)]) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  }
  const bbox = (maxX >= 0) ? { x: minX, y: minY, width: Math.max(1, maxX - minX + 1), height: Math.max(1, maxY - minY + 1) } : null;

  return { mask: closed, width: w, height: h, bbox };
}
