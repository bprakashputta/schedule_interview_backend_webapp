function confirmDelete(interviewId) {
  if (confirm("Are you sure you want to delete this interview?")) {
    window.location.href = "/api/interview/delete/" + interviewId;
  }
}
