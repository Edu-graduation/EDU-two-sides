const { createClient } = supabase;
const supabaseProjectUrl = "https://iuiwdjtmdeempcqxeuhf.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1aXdkanRtZGVlbXBjcXhldWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NTY1MDcsImV4cCI6MjA2MDMzMjUwN30.XfSmnKA8wbsXIA1qkfYaRkzxtEdudIDNYbSJu-M5Zag";
export const supaClient = createClient(supabaseProjectUrl, supabaseKey);
const instructorId = sessionStorage.getItem("instructorId");
const logoutButton = document.querySelector(".log-out");
function isUserLoggedIn() {
  if (!instructorId && !window.location.href.includes("index.html")) {
    alert("sign in first");
    window.location.href = "../../../index.html"; // Redirect to the sign-in page
    return;
  }
}
isUserLoggedIn();
function logOut() {
  const confirmation = confirm("Are you sure you want to log out!");
  if (!confirmation) return;
  sessionStorage.removeItem("instructorId");
  window.location.href = "../../../index.html";
}
logoutButton.addEventListener("click", logOut);
export async function getInstructorName(instructorId) {
  const { data, error } = await supaClient
    .from("instructor")
    .select("instructor_name")
    .eq("instructor_id", instructorId);
  if (error) {
    console.error("Error fetching student name:", error);
    return null;
  }
  if (data && data.length > 0) {
    // const name = data[0].student_name;
    // userName.textContent = name;
    return data[0].instructor;
  }
}
getInstructorName(instructorId);
// if (sessionStorage.getItem("studentId")) {
//   sessionStorage.removeItem("studentId");
//   alert("please log in again");
//   window.location.href = "../../../index.html";
// }
