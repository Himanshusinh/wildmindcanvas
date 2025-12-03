// Non-AI GrabCut-lite implementation
// Foreground/background Gaussian models + edge-aware refinement loop
// Returns mask and tight bbox for a given ImageData region.

export interface GrabCutResult {
  mask: Uint8Array; // 1 = foreground, 0 = background
  width: number;
  height: number;
  bbox: { x: number; y: number; width: number; height: number } | null;
}

function toLum(data: Uint8ClampedArray, w: number, h: number): Float32Array {
  const out = new Float32Array(w*h);
  for (let i=0, p=0; i<data.length; i+=4, p++) {
    out[p] = 0.2126*data[i] + 0.7152*data[i+1] + 0.0722*data[i+2];
  }
  return out;
}

function sobel(lum: Float32Array, w: number, h: number): Float32Array {
  const edge = new Float32Array(w*h);
  const idx = (x:number,y:number)=> y*w+x;
  const sx = [[-1,0,1],[-2,0,2],[-1,0,1]];
  const sy = [[-1,-2,-1],[0,0,0],[1,2,1]];
  for (let y=1; y<h-1; y++) for (let x=1; x<w-1; x++) {
    let gx=0, gy=0;
    for (let j=-1;j<=1;j++) for(let i=-1;i<=1;i++) {
      const v = lum[idx(x+i,y+j)];
      gx += v * sx[j+1][i+1];
      gy += v * sy[j+1][i+1];
    }
    edge[idx(x,y)] = Math.hypot(gx, gy);
  }
  return edge;
}

// Simple Gaussian model on RGB; returns mean and covariance per class
function fitGaussian(data: Uint8ClampedArray, w: number, h: number, mask: Uint8Array, target: 0|1) {
  let n = 0;
  let mr=0, mg=0, mb=0;
  for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
    const p = y*w+x;
    if (mask[p] === target) {
      const i = p*4;
      mr += data[i]; mg += data[i+1]; mb += data[i+2];
      n++;
    }
  }
  n = Math.max(1, n);
  mr/=n; mg/=n; mb/=n;
  // diagonal covariance for speed
  let vr=0, vg=0, vb=0;
  for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
    const p = y*w+x;
    if (mask[p] === target) {
      const i = p*4;
      const dr = data[i]-mr, dg = data[i+1]-mg, db = data[i+2]-mb;
      vr += dr*dr; vg += dg*dg; vb += db*db;
    }
  }
  vr = vr/n; vg = vg/n; vb = vb/n;
  return { mean:[mr,mg,mb], var:[Math.max(vr,1), Math.max(vg,1), Math.max(vb,1)] };
}

function gaussNegLogProb(rgb: [number,number,number], model: {mean:number[]; var:number[]}): number {
  const dr = rgb[0]-model.mean[0], dg = rgb[1]-model.mean[1], db = rgb[2]-model.mean[2];
  return 0.5*(dr*dr/model.var[0] + dg*dg/model.var[1] + db*db/model.var[2]);
}

export function grabCutRegion(imageData: ImageData): GrabCutResult {
  const { data, width: w, height: h } = imageData;
  const lum = toLum(data, w, h);
  const edge = sobel(lum, w, h);
  const idx = (x:number,y:number)=> y*w + x;

  // Initialize mask: rectangle interior unknown → foreground, 10px border → background
  const mask = new Uint8Array(w*h);
  const border = Math.max(2, Math.floor(Math.min(w,h)*0.02));
  for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
    const p = idx(x,y);
    const isBorder = (x<border || x>=w-border || y<border || y>=h-border);
    mask[p] = isBorder ? 0 : 1;
  }

  // Iterative refinement: fit Gaussians and reassign by energy + edge penalty
  const iters = 5;
  for (let t=0; t<iters; t++) {
    const fg = fitGaussian(data, w, h, mask, 1);
    const bg = fitGaussian(data, w, h, mask, 0);
    for (let y=1; y<h-1; y++) for (let x=1; x<w-1; x++) {
      const p = idx(x,y);
      const i = p*4;
      const rgb: [number,number,number] = [data[i], data[i+1], data[i+2]];
      const Ef = gaussNegLogProb(rgb, fg);
      const Eb = gaussNegLogProb(rgb, bg);
      // Edge penalty: prefer boundaries where edge is strong
      const e = edge[p];
      const lambda = 0.15; // weighting
      const Pf = Ef + lambda * (1/(1+e));
      const Pb = Eb + lambda * (e);
      mask[p] = (Pf < Pb) ? 1 : 0;
    }
  }

  // Morphological cleanup (closing)
  const dil = mask.slice();
  for (let y=1; y<h-1; y++) for (let x=1; x<w-1; x++) {
    let v = 0;
    for (let j=-1;j<=1;j++) for(let i=-1;i<=1;i++) v = v || mask[idx(x+i,y+j)];
    dil[idx(x,y)] = v as number;
  }
  const closed = dil.slice();
  for (let y=1; y<h-1; y++) for (let x=1; x<w-1; x++) {
    let v = 1;
    for (let j=-1;j<=1;j++) for(let i=-1;i<=1;i++) v = v && dil[idx(x+i,y+j)] ? 1 : 0;
    closed[idx(x,y)] = v as number;
  }

  // Bounding box
  let minX=w, minY=h, maxX=-1, maxY=-1;
  for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
    if (closed[idx(x,y)]) { minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y); }
  }
  const bbox = (maxX>=0) ? { x:minX, y:minY, width: Math.max(1, maxX-minX+1), height: Math.max(1, maxY-minY+1) } : null;
  return { mask: closed, width: w, height: h, bbox };
}
