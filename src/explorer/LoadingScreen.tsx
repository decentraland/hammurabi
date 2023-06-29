import React from 'react'

export function LoadingScreen({ total, pending }: { total: number; pending: number} ) {
  return <div id="loading">
    Loading scenes: {total - pending}/{total}
    <br />
    <progress value={total - pending} max={total} />
  </div>
}
