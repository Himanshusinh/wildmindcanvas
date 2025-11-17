// Small runtime guard to safely release any active pointer capture recorded
// by send nodes. Importing this file installs global listeners once.

if (typeof window !== 'undefined') {
  const win: any = window as any;
  if (!win.__canvas_capture_guard_installed) {
    const releaseActive = () => {
      try {
        const active = win.__canvas_active_capture;
        if (active && active.element && typeof active.pid === 'number') {
          try { active.element.releasePointerCapture(active.pid); } catch (err) {}
          try { delete win.__canvas_active_capture; } catch (err) {}
        }
      } catch (err) {}
    };

    window.addEventListener('canvas-node-complete', releaseActive as EventListener);
    window.addEventListener('pointerup', releaseActive as EventListener);

    win.__canvas_capture_guard_installed = true;
  }
}

export {};
