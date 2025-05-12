export default function CourseTable({ course_list, deleteCourse }) {
  return (
    <div className="mt-4">
      <h4>Course List</h4>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Course ID</th>
            <th>Course Name</th>
            <th>Course engName</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {course_list && course_list.length > 0 ? (
            course_list.map((courseItem) => (
              <tr key={courseItem.course_id}>
                <td>{courseItem.course_id}</td>
                <td>{courseItem.course_name}</td>
                <td>{courseItem.course_engname}</td>
                <td>
                  <button
                    onClick={() => deleteCourse(courseItem.course_id)}
                    className="btn btn-danger btn-sm">
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">
                No courses available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
