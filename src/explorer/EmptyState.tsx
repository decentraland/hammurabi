import React from "react";

export const EmptyState: React.FC = () => {
  return <div className="emptyState">
    <div>You currently have no realm selected.</div>
    <div><b>Click on the direction bar 👆 and type a realm to start.</b></div>
  </div>
}