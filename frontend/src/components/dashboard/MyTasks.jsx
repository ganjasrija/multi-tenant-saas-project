const MyTasks = ({ tasks }) => {
  return (
    <div>
      <h3>My Tasks</h3>


      {tasks.map((t) => (
        <div key={t.id} style={taskStyle}>
          <strong>{t.title}</strong>
          <span>{t.projectName}</span>
          <span>{t.priority}</span>
          <span>{t.dueDate?.split("T")[0]}</span>
        </div>
      ))}
    </div>
  );
};


const taskStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 2fr 1fr 1fr",
  borderBottom: "1px solid #eee",
  padding: "10px 0",
};


export default MyTasks;