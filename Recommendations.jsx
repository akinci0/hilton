function getRecByOccupancy(occ) {
  if (occ >= 85) {
    return [
      { title: "Staff Increase Opportunity", body: "Occupancy is high. Consider temporary staffing for peak workload." },
      { title: "Service Quality Risk", body: "High demand can reduce service quality. Monitor complaints and response time." },
      { title: "Revenue Upside", body: "Review pricing and packages to maximize peak-season revenue." },
    ];
  }
  if (occ >= 70) {
    return [
      { title: "Optimize Scheduling", body: "Adjust shift planning before hiring new staff." },
      { title: "Upsell Focus", body: "Target upsell in Rooms and FandB to lift revenue per guest." },
      { title: "Monitor Trend", body: "Track occupancy changes and prepare hiring scenario." },
    ];
  }
  return [
    { title: "Cost Control", body: "Low occupancy. Avoid permanent hiring; use flexible staffing if needed." },
    { title: "Demand Stimulation", body: "Consider promotions and corporate deals to lift weekday occupancy." },
    { title: "Training Window", body: "Use this period to train staff and improve service processes." },
  ];
}

export default function Recommendations({ district }) {
  const occ = Number(district?.occupancy ?? 0);
  const items = getRecByOccupancy(occ);

  return (
    <div className="card">
      <div className="cardHeader">
        <div className="cardTitle">Recommendations</div>
        <div className="cardHint">Short actions for manager</div>
      </div>

      <div className="recList">
        {items.map((it) => (
          <div key={it.title} className="recItem">
            <div className="recTitle">{it.title}</div>
            <div className="recBody">{it.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
