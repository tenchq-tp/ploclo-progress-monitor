export default function AddCourse({
  newCourse,
  handleCourseChange,
  addCourse,
  allFiltersSelected,
}) {
  return (
    <div className="mb-4">
      <h4>Add Course</h4>
      <div className="row">
        <div className="col-md-3">
          <input
            className="form-control mb-2"
            placeholder="Course ID"
            name="course_id"
            value={newCourse.course_id}
            onChange={handleCourseChange}
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control mb-2"
            placeholder="Course Name (Thai)"
            name="course_name"
            value={newCourse.course_name}
            onChange={handleCourseChange}
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control mb-2"
            placeholder="Course Name (English)"
            name="course_engname"
            value={newCourse.course_engname}
            onChange={handleCourseChange}
          />
        </div>
        <div className="col-md-2">
          <input
            className="form-control mb-2"
            placeholder="Section"
            name="section"
            value={newCourse.section}
            onChange={handleCourseChange}
          />
        </div>
        <div className="col-md-1">
          <button
            onClick={addCourse}
            className="btn btn-success"
            disabled={!allFiltersSelected}>
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
