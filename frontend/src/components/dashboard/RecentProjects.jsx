const RecentProjects = ({ projects }) => {
  return (
    <div>
      <h3>Recent Projects</h3>

      {projects.slice(0, 5).map((p) => (
        <div key={p.id} style={itemStyle}>
          <strong>{p.name}</strong>
          <span>Status: {p.status}</span>
          <span>Tasks: {p.taskCount}</span>
        </div>
      ))}
    </div>
  );
};

const itemStyle = {
  borderBottom: "1px solid #eee",
  padding: "10px 0",
  display: "flex",
  justifyContent: "space-between",
};

export default RecentProjects;
