Connected input image resolution
connectedImageSource / connectedImageSources useMemo + “hydrate into sourceImageUrl + persist via onOptionsChangeRef.current”
Present in: Upscale, Vectorize, RemoveBg, Expand, Erase, Multiangle, NextScene
Candidate: useConnectedSourceImage(...) / useConnectedSources(...)
Dimming
Same window.addEventListener('canvas-frame-dim', ...) effect
Present in: Upscale, Vectorize, RemoveBg, Expand, Erase, Multiangle, NextScene
Candidate: useCanvasFrameDim(id)
Expand/collapse persistence
Same “sync isExpanded prop into local state” + togglePopup(newState) + call onUpdateModalState(id, { isExpanded })
Present in: most plugin modals (including Compare)
Candidate: usePersistedPopupState({isExpanded, id, onUpdateModalState})
Proxy URL logic
Same “if url is zata → use buildProxyResourceUrl” branches in multiple plugins
Candidate: normalizeImageUrl(url) helper
Option persistence pattern
Lots of onOptionsChangeRef.current({...}) usage + “update ref in effect”
Candidate: small helper hook useLatestRef(callback) + consistent persistOptions(updates) wrapper
Image/video resolution detection
imageResolution state + load image/video to measure dimensions (not everywhere, but repeated)
Candidate: useMediaResolution(url)
Repeated UI (good candidates to extract)
Same node UI layout
Circle node + label + popup placement math (circleDiameter, controlsWidthPx, popupOverlap) and the same container styling patterns
Candidate: PluginNodeShell component
Controls frames
Every plugin has *Controls.tsx with similar container styling + fields
Candidate: shared “ControlsPanel” wrapper + shared field components (dropdown/input/slider)
Connection nodes
Many plugins already share or duplicate ConnectionNodes variants
Candidate: a single configurable PluginConnectionNodes component used everywhere
