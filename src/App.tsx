export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#F2EDE4' }}>
      {/* Tauri v2 overlay windows need an explicit drag region (tauri#9503): this strip is the draggable titlebar; the native macOS traffic lights overlay it. */}
      <div data-tauri-drag-region style={{ height: 32, flexShrink: 0, userSelect: 'none' }} />
      {/* Canvas area — Phase 2 mounts React Flow here. */}
      <div style={{ flex: 1 }} />
    </div>
  );
}
