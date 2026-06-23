self.onmessage = (e: MessageEvent) => {
  const { id, referencePoints, targetPoints } = e.data;
  
  if (!referencePoints || !targetPoints || referencePoints.length === 0 || targetPoints.length === 0) {
    self.postMessage({ id, bestOffset: 0 });
    return;
  }
  
  const n = referencePoints.length;
  let bestOffset = 0;
  let minTotalDist = Infinity;
  
  for (let offset = 0; offset < n; offset += 4) {
    let totalDist = 0;
    for (let i = 0; i < n; i++) {
      const sp = referencePoints[i];
      const tp = targetPoints[(i + offset) % n];
      if (!sp || !tp) continue;
      
      const dx = tp.x - sp.x;
      const dy = tp.y - sp.y;
      totalDist += dx * dx + dy * dy;
    }
    if (totalDist < minTotalDist) {
      minTotalDist = totalDist;
      bestOffset = offset;
    }
  }
  
  self.postMessage({ id, bestOffset });
};
