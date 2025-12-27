const StatsCards = ({ stats }) => {
  return (
    <div style={{ display: "flex", gap: "20px" }}>
      {Object.entries(stats).map(([key, value]) => (
        <div key={key} style={cardStyle}>
          <h4>{key.replace(/([A-Z])/g, " $1")}</h4>
          <h2>{value}</h2>
        </div>
      ))}
    </div>
  );
};

const cardStyle = {
  border: "1px solid #ccc",
  padding: "20px",
  width: "200px",
  borderRadius: "8px",
  textAlign: "center",
};

export default StatsCards;
