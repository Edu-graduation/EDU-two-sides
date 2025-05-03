// import { supaClient } from "./main.js";

// // Get instructorId from session storage
// const instructorId = sessionStorage.getItem("instructorId");

// // DOM elements
// let courseNameSelect = document.getElementById("course-name");
// const projectListBody = document.getElementById("projectListBody");
// const submissionListBody = document.getElementById("submissionListBody");
// const projectTitleInput = document.getElementById("projectTitle");
// const projectDescriptionInput = document.getElementById("projectDescription");
// const dueDateInput = document.getElementById("dueDate");
// const submitProjectBtn = document.getElementById("submitProject");
// const successMessage = document.getElementById("successMessage");

// // Get courses with enrollment counts for the instructor
// async function getCoursesWithEnrollmentCounts(instructorId) {
//   try {
//     // Step 1: Fetch all enrollments for this instructor
//     const { data: enrollments, error } = await supaClient
//       .from("enrollment")
//       .select("course_id")
//       .eq("instructor_id", instructorId);

//     if (error) {
//       console.error("Error fetching enrollments:", error);
//       return [];
//     }

//     // Step 2: Get unique course_ids
//     const uniqueCourses = [...new Set(enrollments.map((e) => e.course_id))];

//     // Step 3: For each course_id, count number of students
//     const results = [];
//     for (let courseId of uniqueCourses) {
//       const { count, error: countError } = await supaClient
//         .from("enrollment")
//         .select("student_id", { count: "exact", head: true })
//         .eq("course_id", courseId)
//         .eq("instructor_id", instructorId);

//       if (countError) {
//         console.error(
//           `Error counting students for course ${courseId}:`,
//           countError
//         );
//       } else {
//         results.push({ course_id: courseId, student_count: count });
//       }
//     }
//     return results;
//   } catch (error) {
//     console.error("Error in getCoursesWithEnrollmentCounts:", error);
//     return [];
//   }
// }

// // Get course details for the instructor
// async function getInstructorCourses() {
//   try {
//     const instructorCourses = await getCoursesWithEnrollmentCounts(
//       instructorId
//     );

//     if (!instructorCourses || instructorCourses.length === 0) {
//       console.log("No courses found for this instructor");
//       return [];
//     }

//     const { data, error } = await supaClient
//       .from("course")
//       .select("*")
//       .in(
//         "course_id",
//         instructorCourses.map((c) => c.course_id)
//       );

//     if (error) {
//       console.error("Error fetching instructor courses:", error);
//       return [];
//     }

//     return data || [];
//   } catch (error) {
//     console.error("Error in getInstructorCourses:", error);
//     return [];
//   }
// }

// // Get projects for a specific course
// async function getInstructorProjects(courseId) {
//   try {
//     console.log("Fetching projects for course ID:", courseId);

//     if (!courseId) {
//       const instructorCourses = await getInstructorCourses();
//       if (instructorCourses && instructorCourses.length > 0) {
//         courseId = instructorCourses[0].course_id;
//       } else {
//         return [];
//       }
//     }

//     const { data, error } = await supaClient
//       .from("activity")
//       .select("*")
//       .eq("instructor_id", instructorId);

//     if (error) {
//       console.error("Error fetching projects:", error);
//       return [];
//     }

//     console.log("Projects fetched:", data);
//     return data || [];
//   } catch (error) {
//     console.error("Error in getInstructorProjects:", error);
//     return [];
//   }
// }

// // Render projects in the table
// async function renderInstructorProjects(courseId) {
//   try {
//     const projects = await getInstructorProjects(courseId);

//     // Clear existing projects
//     projectListBody.innerHTML = "";

//     if (!projects || projects.length === 0) {
//       projectListBody.innerHTML = `
//         <tr>
//           <td colspan="3" style="text-align: center;">No projects found for this course</td>
//         </tr>`;
//       return;
//     }

//     // Create HTML for each project
//     projects.forEach((project, index) => {
//       const row = document.createElement("tr");

//       // Format the date properly
//       const dueDate = new Date(project.activity_duedate);
//       const formattedDate = dueDate.toLocaleDateString();

//       row.innerHTML = `
//         <td>
//           <span class="project-number">${index + 1}</span> ${
//         project.activity_title
//       }
//         </td>
//         <td>${formattedDate}</td>
//         <td><p class="show__project-details" data-id="${
//           project.activity_id
//         }">View</p></td>
//       `;

//       projectListBody.appendChild(row);
//     });

//     // Add event listeners to view buttons
//     document.querySelectorAll(".show__project-details").forEach((button) => {
//       button.addEventListener("click", () => {
//         const activityId = button.getAttribute("data-id");
//         showProjectDetails(activityId);
//       });
//     });

//     // After rendering projects, render the student submissions for this course
//     renderStudentSubmissionsForCourse(courseId);
//   } catch (error) {
//     console.error("Error in renderInstructorProjects:", error);
//     projectListBody.innerHTML = `
//       <tr>
//         <td colspan="3" style="text-align: center;">Error loading projects</td>
//       </tr>`;
//   }
// }

// // Show project details in a modal
// async function showProjectDetails(activityId) {
//   try {
//     console.log("Showing details for project:", activityId);

//     // Fetch project details
//     const { data, error } = await supaClient
//       .from("activity")
//       .select("*")
//       .eq("activity_id", activityId)
//       .single();

//     if (error) {
//       console.error("Error fetching project details:", error);
//       alert("Failed to load project details");
//       return;
//     }

//     if (!data) {
//       alert("Project not found");
//       return;
//     }

//     // Create modal if it doesn't exist
//     let modal = document.getElementById("projectDetailsModal");
//     if (!modal) {
//       modal = document.createElement("div");
//       modal.id = "projectDetailsModal";
//       modal.className = "modal";

//       // Create modal content
//       modal.innerHTML = `
//         <div class="modal-content">
//           <span class="close-modal">&times;</span>
//           <h2 id="modal-title">Project Details</h2>
//           <div id="modal-body">
//             <div class="detail-row">
//               <strong>Title:</strong>
//               <span id="modal-project-title"></span>
//             </div>
//             <div class="detail-row">
//               <strong>Description:</strong>
//               <p id="modal-project-description"></p>
//             </div>
//             <div class="detail-row">
//               <strong>Due Date:</strong>
//               <span id="modal-project-duedate"></span>
//             </div>
//           </div>
//         </div>
//       `;

//       // Add modal to the body
//       document.body.appendChild(modal);

//       const closeBtn = modal.querySelector(".close-modal");
//       closeBtn.addEventListener("click", () => {
//         modal.style.display = "none";
//       });

//       // Close modal when clicking outside
//       window.addEventListener("click", (event) => {
//         if (event.target === modal) {
//           modal.style.display = "none";
//         }
//       });
//     }

//     // Populate modal with project details
//     document.getElementById("modal-title").textContent = "Project Details";
//     document.getElementById("modal-project-title").textContent =
//       data.activity_title;
//     document.getElementById("modal-project-description").textContent =
//       data.activity_description;

//     // Format due date
//     const dueDate = new Date(data.activity_duedate);
//     const formattedDate = dueDate.toLocaleString("en-US", {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//       hour: "numeric",
//       minute: "numeric",
//     });
//     document.getElementById("modal-project-duedate").textContent =
//       formattedDate;

//     // Show the modal
//     modal.style.display = "block";
//   } catch (error) {
//     console.error("Error showing project details:", error);
//     alert("Failed to display project details");
//   }
// }

// // Initialize the course dropdown and load projects
// async function initializeProjectPage() {
//   try {
//     // Clear course dropdown
//     courseNameSelect.innerHTML = "";

//     // Get instructor courses
//     const courses = await getInstructorCourses();

//     if (!courses || courses.length === 0) {
//       courseNameSelect.innerHTML = `<option value="">No courses available</option>`;
//       projectListBody.innerHTML = `
//         <tr>
//           <td colspan="3" style="text-align: center;">No courses available</td>
//         </tr>`;
//       submissionListBody.innerHTML = `
//         <tr>
//           <td colspan="3" style="text-align: center;">No courses available</td>
//         </tr>`;
//       return;
//     }

//     // Reset the event listener to prevent duplicates
//     const oldCourseNameSelect = courseNameSelect.cloneNode(false);
//     courseNameSelect.parentNode.replaceChild(
//       oldCourseNameSelect,
//       courseNameSelect
//     );
//     courseNameSelect = document.getElementById("course-name"); // Reselect the element

//     // Populate course dropdown
//     courses.forEach((course) => {
//       const option = document.createElement("option");
//       option.value = course.course_id;
//       option.textContent = course.course_name;
//       courseNameSelect.appendChild(option);
//     });

//     // Get the first course ID as default
//     const defaultCourseId = courses[0].course_id;

//     // Set the dropdown to the default course
//     courseNameSelect.value = defaultCourseId;

//     // Display projects for the default course
//     renderInstructorProjects(defaultCourseId);

//     // Add event listener for course selection change
//     courseNameSelect.addEventListener("change", (e) => {
//       const selectedCourseId = e.target.value;
//       renderInstructorProjects(selectedCourseId);
//     });
//   } catch (error) {
//     console.error("Error initializing project page:", error);
//   }
// }

// // Submit a new project
// async function submitProject() {
//   try {
//     // Validate inputs
//     const courseId = courseNameSelect.value;
//     const title = projectTitleInput.value.trim();
//     const description = projectDescriptionInput.value.trim();
//     const dueDate = dueDateInput.value.trim();

//     if (!courseId || !title || !description || !dueDate) {
//       alert("Please fill in all fields");
//       return;
//     }

//     // Parse date
//     const parsedDate = new Date(dueDate);
//     if (isNaN(parsedDate.getTime())) {
//       alert("Please enter a valid date in the format mm/dd/yyyy --:-- --");
//       return;
//     }

//     // Disable button to prevent multiple submissions
//     submitProjectBtn.disabled = true;

//     // Insert new project
//     const { data, error } = await supaClient.from("activity").insert([
//       {
//         instructor_id: instructorId,
//         course_id: courseId,
//         activity_title: title,
//         activity_description: description,
//         activity_duedate: parsedDate.toISOString(),
//       },
//     ]);

//     if (error) {
//       console.error("Error submitting project:", error);
//       alert("Failed to submit project");
//       submitProjectBtn.disabled = false;
//       return;
//     }

//     // Clear form
//     projectTitleInput.value = "";
//     projectDescriptionInput.value = "";
//     dueDateInput.value = "";

//     // Show success message
//     successMessage.style.display = "block";
//     setTimeout(() => {
//       successMessage.style.display = "none";
//     }, 3000);

//     // Refresh project list
//     renderInstructorProjects(courseId);

//     // Re-enable button
//     submitProjectBtn.disabled = false;
//   } catch (error) {
//     console.error("Error in submitProject:", error);
//     alert("An error occurred while submitting the project");
//     submitProjectBtn.disabled = false;
//   }
// }

// // Add event listener for form submission
// submitProjectBtn.addEventListener("click", submitProject);

// ///////////////////////  GET STUDENTS PROJECTS /////////////////////

// // Get activity IDs for a specific course
// async function getActivityIDsForCourse(courseId) {
//   try {
//     const { data, error } = await supaClient
//       .from("activity")
//       .select("activity_id")
//       .eq("instructor_id", instructorId);
//     if (error) {
//       console.error("Error fetching activity IDs for course:", error);
//       return [];
//     }

//     return data || [];
//   } catch (error) {
//     console.error("Error in getActivityIDsForCourse:", error);
//     return [];
//   }
// }

// // Get student submissions for specific activities
// async function getStudentSubmissionsForActivities(activityIds) {
//   try {
//     if (!activityIds || activityIds.length === 0) {
//       return [];
//     }

//     const { data, error } = await supaClient
//       .from("student_activity")
//       .select("*")
//       .in(
//         "activity_id",
//         activityIds.map((a) => a.activity_id)
//       );

//     if (error) {
//       console.error("Error fetching student submissions:", error);
//       return [];
//     }

//     return data || [];
//   } catch (error) {
//     console.error("Error in getStudentSubmissionsForActivities:", error);
//     return [];
//   }
// }

// // Get activity details
// async function getActivityDetails(activityIds) {
//   try {
//     if (!activityIds || activityIds.length === 0) {
//       return [];
//     }

//     const { data, error } = await supaClient
//       .from("activity")
//       .select("*")
//       .in("activity_id", activityIds);

//     if (error) {
//       console.error("Error fetching activity details:", error);
//       return [];
//     }

//     return data || [];
//   } catch (error) {
//     console.error("Error in getActivityDetails:", error);
//     return [];
//   }
// }

// // Get student details
// async function getStudentDetails(studentIds) {
//   try {
//     if (!studentIds || studentIds.length === 0) {
//       return [];
//     }

//     const { data, error } = await supaClient
//       .from("student")
//       .select("*")
//       .in("student_id", studentIds);

//     if (error) {
//       console.error("Error fetching student details:", error);
//       return [];
//     }

//     return data || [];
//   } catch (error) {
//     console.error("Error in getStudentDetails:", error);
//     return [];
//   }
// }

// // Render student submissions for a specific course
// async function renderStudentSubmissionsForCourse(courseId) {
//   try {
//     // Clear existing submissions
//     submissionListBody.innerHTML = "";

//     // Get activity IDs for the selected course
//     const activityIds = await getActivityIDsForCourse(courseId);

//     if (!activityIds || activityIds.length === 0) {
//       submissionListBody.innerHTML = `
//         <tr>
//           <td colspan="3" style="text-align: center;">No projects found for this course</td>
//         </tr>`;
//       return;
//     }

//     // Get student submissions for these activities
//     const submissions = await getStudentSubmissionsForActivities(activityIds);

//     if (!submissions || submissions.length === 0) {
//       submissionListBody.innerHTML = `
//         <tr>
//           <td colspan="3" style="text-align: center;">No student submissions found for this course</td>
//         </tr>`;
//       return;
//     }

//     // Get details for activities and students
//     const activityDetails = await getActivityDetails([
//       ...new Set(submissions.map((s) => s.activity_id)),
//     ]);

//     const studentDetails = await getStudentDetails([
//       ...new Set(submissions.map((s) => s.student_id)),
//     ]);

//     // Create HTML for each submission
//     let markup = "";
//     submissions.forEach((submission) => {
//       const student = studentDetails.find(
//         (s) => s.student_id === submission.student_id
//       );
//       const activity = activityDetails.find(
//         (a) => a.activity_id === submission.activity_id
//       );

//       if (student && activity) {
//         markup += `<tr>
//                     <td>${student.student_name || "Unknown Student"}</td>
//                     <td>${activity.activity_title || "Unknown Project"}</td>
//                     <td><a target="_blank" href="${
//                       submission.activity_path
//                     }" class="view-submission-button">View</a></td>
//                   </tr>`;
//       }
//     });

//     submissionListBody.innerHTML =
//       markup ||
//       `
//       <tr>
//         <td colspan="3" style="text-align: center;">Could not display submissions properly</td>
//       </tr>`;
//   } catch (error) {
//     console.error("Error in renderStudentSubmissionsForCourse:", error);
//     submissionListBody.innerHTML = `
//       <tr>
//         <td colspan="3" style="text-align: center;">Error loading student submissions</td>
//       </tr>`;
//   }
// }

// // Initialize the page only once when the DOM is loaded
// let initialized = false;

// document.addEventListener("DOMContentLoaded", () => {
//   if (initialized) return;

//   // Check if instructor ID exists
//   if (!instructorId) {
//     console.error("No instructor ID found in session storage");
//     alert("Please log in as an instructor");
//     window.location.href = "index.html"; // Redirect to login page
//     return;
//   }

//   initializeProjectPage();
//   initialized = true;
// });
/////////////////////////////////// VERSION 2 ////////////////////////
// import { supaClient } from "./main.js";

// // Get instructorId from session storage
// const instructorId = sessionStorage.getItem("instructorId");

// // DOM elements
// let courseNameSelect = document.getElementById("course-name");
// const projectListBody = document.getElementById("projectListBody");
// const submissionListBody = document.getElementById("submissionListBody");
// const projectTitleInput = document.getElementById("projectTitle");
// const projectDescriptionInput = document.getElementById("projectDescription");
// const dueDateInput = document.getElementById("dueDate");
// const submitProjectBtn = document.getElementById("submitProject");
// const successMessage = document.getElementById("successMessage");

// // Get courses with enrollment counts for the instructor
// async function getCoursesWithEnrollmentCounts(instructorId) {
//   try {
//     // Step 1: Fetch all enrollments for this instructor
//     const { data: enrollments, error } = await supaClient
//       .from("enrollment")
//       .select("course_id")
//       .eq("instructor_id", instructorId);

//     if (error) {
//       console.error("Error fetching enrollments:", error);
//       return [];
//     }

//     // Step 2: Get unique course_ids
//     const uniqueCourses = [...new Set(enrollments.map((e) => e.course_id))];

//     // Step 3: For each course_id, count number of students
//     const results = [];
//     for (let courseId of uniqueCourses) {
//       const { count, error: countError } = await supaClient
//         .from("enrollment")
//         .select("student_id", { count: "exact", head: true })
//         .eq("course_id", courseId)
//         .eq("instructor_id", instructorId);

//       if (countError) {
//         console.error(
//           `Error counting students for course ${courseId}:`,
//           countError
//         );
//       } else {
//         results.push({ course_id: courseId, student_count: count });
//       }
//     }
//     return results;
//   } catch (error) {
//     console.error("Error in getCoursesWithEnrollmentCounts:", error);
//     return [];
//   }
// }

// // Get course details for the instructor
// async function getInstructorCourses() {
//   try {
//     const instructorCourses = await getCoursesWithEnrollmentCounts(
//       instructorId
//     );

//     if (!instructorCourses || instructorCourses.length === 0) {
//       console.log("No courses found for this instructor");
//       return [];
//     }

//     const { data, error } = await supaClient
//       .from("course")
//       .select("*")
//       .in(
//         "course_id",
//         instructorCourses.map((c) => c.course_id)
//       );

//     if (error) {
//       console.error("Error fetching instructor courses:", error);
//       return [];
//     }

//     return data || [];
//   } catch (error) {
//     console.error("Error in getInstructorCourses:", error);
//     return [];
//   }
// }

// // Get projects for a specific course
// async function getInstructorProjects(courseId) {
//   try {
//     console.log("Fetching projects for course ID:", courseId);

//     if (!courseId) {
//       const instructorCourses = await getInstructorCourses();
//       if (instructorCourses && instructorCourses.length > 0) {
//         courseId = instructorCourses[0].course_id;
//       } else {
//         return [];
//       }
//     }

//     // First, validate if this course belongs to this instructor
//     const { data: courseCheck, error: courseError } = await supaClient
//       .from("enrollment")
//       .select("course_id")
//       .eq("instructor_id", instructorId)
//       .eq("course_id", courseId)
//       .limit(1);

//     if (courseError) {
//       console.error("Error validating course access:", courseError);
//       return [];
//     }

//     if (!courseCheck || courseCheck.length === 0) {
//       console.error("Course does not belong to this instructor");
//       return [];
//     }

//     // Fetch projects for this validated course
//     const { data, error } = await supaClient
//       .from("activity")
//       .select("*")
//       .eq("instructor_id", instructorId);
//     if (error) {
//       console.error("Error fetching projects:", error);
//       return [];
//     }

//     console.log("Projects fetched:", data);
//     return data || [];
//   } catch (error) {
//     console.error("Error in getInstructorProjects:", error);
//     return [];
//   }
// }

// // Render projects in the table
// async function renderInstructorProjects(courseId) {
//   try {
//     console.log("Rendering projects for course ID:", courseId);

//     // Clear existing projects and show loading state
//     projectListBody.innerHTML = `
//       <tr>
//         <td colspan="3" style="text-align: center;">Loading projects...</td>
//       </tr>`;

//     // Get projects for this course
//     const projects = await getInstructorProjects(courseId);

//     // Clear existing projects after data is loaded
//     projectListBody.innerHTML = "";

//     if (!projects || projects.length === 0) {
//       projectListBody.innerHTML = `
//         <tr>
//           <td colspan="3" style="text-align: center;">No projects found for this course</td>
//         </tr>`;

//       // Even if no projects were found, we should still check for submissions
//       renderStudentSubmissionsForCourse(courseId);
//       return;
//     }

//     console.log(`Found ${projects.length} projects for course ${courseId}`);

//     // Create HTML for each project
//     projects.forEach((project, index) => {
//       const row = document.createElement("tr");

//       // Format the date properly
//       const dueDate = new Date(project.activity_duedate);
//       const formattedDate = dueDate.toLocaleDateString();

//       row.innerHTML = `
//         <td>
//           <span class="project-number">${index + 1}</span> ${
//         project.activity_title
//       }
//         </td>
//         <td>${formattedDate}</td>
//         <td><p class="show__project-details" data-id="${
//           project.activity_id
//         }">View</p></td>
//       `;

//       projectListBody.appendChild(row);
//     });

//     // Add event listeners to view buttons
//     document.querySelectorAll(".show__project-details").forEach((button) => {
//       button.addEventListener("click", () => {
//         const activityId = button.getAttribute("data-id");
//         showProjectDetails(activityId);
//       });
//     });

//     // After rendering projects, render the student submissions for this course
//     renderStudentSubmissionsForCourse(courseId);
//   } catch (error) {
//     console.error("Error in renderInstructorProjects:", error);
//     projectListBody.innerHTML = `
//       <tr>
//         <td colspan="3" style="text-align: center;">Error loading projects</td>
//       </tr>`;
//   }
// }

// // Show project details in a modal
// async function showProjectDetails(activityId) {
//   try {
//     console.log("Showing details for project:", activityId);

//     // Fetch project details
//     const { data, error } = await supaClient
//       .from("activity")
//       .select("*")
//       .eq("activity_id", activityId)
//       .single();

//     if (error) {
//       console.error("Error fetching project details:", error);
//       alert("Failed to load project details");
//       return;
//     }

//     if (!data) {
//       alert("Project not found");
//       return;
//     }

//     // Create modal if it doesn't exist
//     let modal = document.getElementById("projectDetailsModal");
//     if (!modal) {
//       modal = document.createElement("div");
//       modal.id = "projectDetailsModal";
//       modal.className = "modal";

//       // Create modal content
//       modal.innerHTML = `
//         <div class="modal-content">
//           <span class="close-modal">&times;</span>
//           <h2 id="modal-title">Project Details</h2>
//           <div id="modal-body">
//             <div class="detail-row">
//               <strong>Title:</strong>
//               <span id="modal-project-title"></span>
//             </div>
//             <div class="detail-row">
//               <strong>Description:</strong>
//               <p id="modal-project-description"></p>
//             </div>
//             <div class="detail-row">
//               <strong>Due Date:</strong>
//               <span id="modal-project-duedate"></span>
//             </div>
//           </div>
//         </div>
//       `;

//       // Add modal to the body
//       document.body.appendChild(modal);

//       const closeBtn = modal.querySelector(".close-modal");
//       closeBtn.addEventListener("click", () => {
//         modal.style.display = "none";
//       });

//       // Close modal when clicking outside
//       window.addEventListener("click", (event) => {
//         if (event.target === modal) {
//           modal.style.display = "none";
//         }
//       });
//     }

//     // Populate modal with project details
//     document.getElementById("modal-title").textContent = "Project Details";
//     document.getElementById("modal-project-title").textContent =
//       data.activity_title;
//     document.getElementById("modal-project-description").textContent =
//       data.activity_description;

//     // Format due date
//     const dueDate = new Date(data.activity_duedate);
//     const formattedDate = dueDate.toLocaleString("en-US", {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//       hour: "numeric",
//       minute: "numeric",
//     });
//     document.getElementById("modal-project-duedate").textContent =
//       formattedDate;

//     // Show the modal
//     modal.style.display = "block";
//   } catch (error) {
//     console.error("Error showing project details:", error);
//     alert("Failed to display project details");
//   }
// }

// // Initialize the course dropdown and load projects
// async function initializeProjectPage() {
//   try {
//     // Clear course dropdown
//     courseNameSelect.innerHTML = "";

//     // Get instructor courses
//     const courses = await getInstructorCourses();

//     if (!courses || courses.length === 0) {
//       courseNameSelect.innerHTML = `<option value="">No courses available</option>`;
//       projectListBody.innerHTML = `
//         <tr>
//           <td colspan="3" style="text-align: center;">No courses available</td>
//         </tr>`;
//       submissionListBody.innerHTML = `
//         <tr>
//           <td colspan="3" style="text-align: center;">No courses available</td>
//         </tr>`;
//       return;
//     }

//     // Reset the event listener to prevent duplicates
//     const oldCourseNameSelect = courseNameSelect.cloneNode(false);
//     courseNameSelect.parentNode.replaceChild(
//       oldCourseNameSelect,
//       courseNameSelect
//     );
//     courseNameSelect = document.getElementById("course-name"); // Reselect the element

//     // Populate course dropdown
//     courses.forEach((course) => {
//       const option = document.createElement("option");
//       option.value = course.course_id;
//       option.textContent = course.course_name;
//       courseNameSelect.appendChild(option);
//     });

//     // Get the first course ID as default
//     const defaultCourseId = courses[0].course_id;

//     // Set the dropdown to the default course
//     courseNameSelect.value = defaultCourseId;

//     // Display projects for the default course
//     renderInstructorProjects(defaultCourseId);

//     // Add event listener for course selection change
//     courseNameSelect.addEventListener("change", (e) => {
//       const selectedCourseId = e.target.value;
//       console.log("Course changed to:", selectedCourseId);

//       // Clear existing data
//       projectListBody.innerHTML = `<tr><td colspan="3">Loading projects...</td></tr>`;
//       submissionListBody.innerHTML = `<tr><td colspan="3">Loading submissions...</td></tr>`;

//       // Fetch and render data specific to selected course
//       renderInstructorProjects(selectedCourseId);
//     });
//   } catch (error) {
//     console.error("Error initializing project page:", error);
//   }
// }

// // Submit a new project
// async function submitProject() {
//   try {
//     // Validate inputs
//     const courseId = courseNameSelect.value;
//     const title = projectTitleInput.value.trim();
//     const description = projectDescriptionInput.value.trim();
//     const dueDate = dueDateInput.value.trim();

//     if (!courseId || !title || !description || !dueDate) {
//       alert("Please fill in all fields");
//       return;
//     }

//     // Parse date
//     const parsedDate = new Date(dueDate);
//     if (isNaN(parsedDate.getTime())) {
//       alert("Please enter a valid date in the format mm/dd/yyyy --:-- --");
//       return;
//     }

//     // Disable button to prevent multiple submissions
//     submitProjectBtn.disabled = true;

//     // Insert new project
//     const { data, error } = await supaClient.from("activity").insert([
//       {
//         instructor_id: instructorId,
//         course_id: courseId,
//         activity_title: title,
//         activity_description: description,
//         activity_duedate: parsedDate.toISOString(),
//       },
//     ]);

//     if (error) {
//       console.error("Error submitting project:", error);
//       alert("Failed to submit project");
//       submitProjectBtn.disabled = false;
//       return;
//     }

//     // Clear form
//     projectTitleInput.value = "";
//     projectDescriptionInput.value = "";
//     dueDateInput.value = "";

//     // Show success message
//     successMessage.style.display = "block";
//     setTimeout(() => {
//       successMessage.style.display = "none";
//     }, 3000);

//     // Refresh project list
//     renderInstructorProjects(courseId);

//     // Re-enable button
//     submitProjectBtn.disabled = false;
//   } catch (error) {
//     console.error("Error in submitProject:", error);
//     alert("An error occurred while submitting the project");
//     submitProjectBtn.disabled = false;
//   }
// }

// // Add event listener for form submission
// submitProjectBtn.addEventListener("click", submitProject);

// ///////////////////////  GET STUDENTS PROJECTS /////////////////////

// // Get activity IDs for a specific course
// async function getActivityIDsForCourse(courseId) {
//   try {
//     const { data, error } = await supaClient
//       .from("activity")
//       .select("activity_id")
//       .eq("instructor_id", instructorId);

//     if (error) {
//       console.error("Error fetching activity IDs for course:", error);
//       return [];
//     }

//     return data || [];
//   } catch (error) {
//     console.error("Error in getActivityIDsForCourse:", error);
//     return [];
//   }
// }

// // Get student submissions for specific activities
// async function getStudentSubmissionsForActivities(activityIds) {
//   try {
//     if (!activityIds || activityIds.length === 0) {
//       return [];
//     }

//     const { data, error } = await supaClient
//       .from("student_activity")
//       .select("*")
//       .in(
//         "activity_id",
//         activityIds.map((a) => a.activity_id)
//       );

//     if (error) {
//       console.error("Error fetching student submissions:", error);
//       return [];
//     }

//     return data || [];
//   } catch (error) {
//     console.error("Error in getStudentSubmissionsForActivities:", error);
//     return [];
//   }
// }

// // Get activity details
// async function getActivityDetails(activityIds) {
//   try {
//     if (!activityIds || activityIds.length === 0) {
//       return [];
//     }

//     const { data, error } = await supaClient
//       .from("activity")
//       .select("*")
//       .in("activity_id", activityIds);

//     if (error) {
//       console.error("Error fetching activity details:", error);
//       return [];
//     }

//     return data || [];
//   } catch (error) {
//     console.error("Error in getActivityDetails:", error);
//     return [];
//   }
// }

// // Get student details
// async function getStudentDetails(studentIds) {
//   try {
//     if (!studentIds || studentIds.length === 0) {
//       return [];
//     }

//     const { data, error } = await supaClient
//       .from("student")
//       .select("*")
//       .in("student_id", studentIds);

//     if (error) {
//       console.error("Error fetching student details:", error);
//       return [];
//     }

//     return data || [];
//   } catch (error) {
//     console.error("Error in getStudentDetails:", error);
//     return [];
//   }
// }

// // Render student submissions for a specific course
// async function renderStudentSubmissionsForCourse(courseId) {
//   try {
//     console.log("Rendering submissions for course ID:", courseId);

//     // Clear existing submissions and show loading state
//     submissionListBody.innerHTML = `
//       <tr>
//         <td colspan="3" style="text-align: center;">Loading submissions...</td>
//       </tr>`;

//     // Get activity IDs for the selected course
//     const activityIds = await getActivityIDsForCourse(courseId);

//     if (!activityIds || activityIds.length === 0) {
//       submissionListBody.innerHTML = `
//         <tr>
//           <td colspan="3" style="text-align: center;">No projects found for this course</td>
//         </tr>`;
//       return;
//     }

//     console.log("Found activity IDs:", activityIds);

//     // Get student submissions for these activities
//     const submissions = await getStudentSubmissionsForActivities(activityIds);

//     if (!submissions || submissions.length === 0) {
//       submissionListBody.innerHTML = `
//         <tr>
//           <td colspan="3" style="text-align: center;">No student submissions found for this course</td>
//         </tr>`;
//       return;
//     }

//     console.log("Found submissions:", submissions.length);

//     // Get details for activities and students
//     const activityDetails = await getActivityDetails([
//       ...new Set(submissions.map((s) => s.activity_id)),
//     ]);

//     const studentDetails = await getStudentDetails([
//       ...new Set(submissions.map((s) => s.student_id)),
//     ]);

//     console.log("Activity details:", activityDetails.length);
//     console.log("Student details:", studentDetails.length);

//     // Create HTML for each submission
//     let markup = "";
//     submissions.forEach((submission) => {
//       const student = studentDetails.find(
//         (s) => s.student_id === submission.student_id
//       );
//       const activity = activityDetails.find(
//         (a) => a.activity_id === submission.activity_id
//       );

//       if (student && activity) {
//         markup += `<tr>
//                     <td>${student.student_name || "Unknown Student"}</td>
//                     <td>${activity.activity_title || "Unknown Project"}</td>
//                     <td><a target="_blank" href="${
//                       submission.activity_path
//                     }" class="view-submission-button">View</a></td>
//                   </tr>`;
//       }
//     });

//     submissionListBody.innerHTML =
//       markup ||
//       `
//       <tr>
//         <td colspan="3" style="text-align: center;">Could not display submissions properly</td>
//       </tr>`;
//   } catch (error) {
//     console.error("Error in renderStudentSubmissionsForCourse:", error);
//     submissionListBody.innerHTML = `
//       <tr>
//         <td colspan="3" style="text-align: center;">Error loading student submissions</td>
//       </tr>`;
//   }
// }

// // Initialize the page only once when the DOM is loaded
// let initialized = false;

// document.addEventListener("DOMContentLoaded", () => {
//   if (initialized) return;

//   // Check if instructor ID exists
//   if (!instructorId) {
//     console.error("No instructor ID found in session storage");
//     alert("Please log in as an instructor");
//     window.location.href = "index.html"; // Redirect to login page
//     return;
//   }

//   initializeProjectPage();
//   initialized = true;
// });

/////////////////////// VERSION 3 ////////////////////////
import { supaClient } from "./main.js";

// Get instructorId from session storage
const instructorId = sessionStorage.getItem("instructorId");

// DOM elements
let courseNameSelect = document.getElementById("course-name");
const projectListBody = document.getElementById("projectListBody");
const submissionListBody = document.getElementById("submissionListBody");
const projectTitleInput = document.getElementById("projectTitle");
const projectDescriptionInput = document.getElementById("projectDescription");
const dueDateInput = document.getElementById("dueDate");
const submitProjectBtn = document.getElementById("submitProject");
const successMessage = document.getElementById("successMessage");

// Get courses with enrollment counts for the instructor
async function getCoursesWithEnrollmentCounts(instructorId) {
  try {
    // Step 1: Fetch all enrollments for this instructor
    const { data: enrollments, error } = await supaClient
      .from("enrollment")
      .select("course_id")
      .eq("instructor_id", instructorId);

    if (error) {
      console.error("Error fetching enrollments:", error);
      return [];
    }

    // Step 2: Get unique course_ids
    const uniqueCourses = [...new Set(enrollments.map((e) => e.course_id))];

    // Step 3: For each course_id, count number of students
    const results = [];
    for (let courseId of uniqueCourses) {
      const { count, error: countError } = await supaClient
        .from("enrollment")
        .select("student_id", { count: "exact", head: true })
        .eq("course_id", courseId)
        .eq("instructor_id", instructorId);

      if (countError) {
        console.error(
          `Error counting students for course ${courseId}:`,
          countError
        );
      } else {
        results.push({ course_id: courseId, student_count: count });
      }
    }
    return results;
  } catch (error) {
    console.error("Error in getCoursesWithEnrollmentCounts:", error);
    return [];
  }
}

// Get course details for the instructor
async function getInstructorCourses() {
  try {
    const instructorCourses = await getCoursesWithEnrollmentCounts(
      instructorId
    );

    if (!instructorCourses || instructorCourses.length === 0) {
      console.log("No courses found for this instructor");
      return [];
    }

    const { data, error } = await supaClient
      .from("course")
      .select("*")
      .in(
        "course_id",
        instructorCourses.map((c) => c.course_id)
      );

    if (error) {
      console.error("Error fetching instructor courses:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getInstructorCourses:", error);
    return [];
  }
}

// Get projects for a specific course
async function getInstructorProjects(courseId) {
  try {
    console.log("Fetching projects for course ID:", courseId);

    if (!courseId) {
      const instructorCourses = await getInstructorCourses();
      if (instructorCourses && instructorCourses.length > 0) {
        courseId = instructorCourses[0].course_id;
      } else {
        return [];
      }
    }

    // First, validate if this course belongs to this instructor
    const { data: courseCheck, error: courseError } = await supaClient
      .from("enrollment")
      .select("course_id")
      .eq("instructor_id", instructorId)
      .eq("course_id", courseId)
      .limit(1);

    if (courseError) {
      console.error("Error validating course access:", courseError);
      return [];
    }

    if (!courseCheck || courseCheck.length === 0) {
      console.error("Course does not belong to this instructor");
      return [];
    }

    // First, get activity IDs associated with this course
    const { data: courseActivities, error: courseActivitiesError } =
      await supaClient
        .from("course_activity")
        .select("activity_id")
        .eq("course_id", courseId);

    if (courseActivitiesError) {
      console.error("Error fetching course activities:", courseActivitiesError);
      return [];
    }

    if (!courseActivities || courseActivities.length === 0) {
      console.log("No activities found for this course");
      return [];
    }

    // Now fetch the detailed activity information for these activity IDs
    const { data, error } = await supaClient
      .from("activity")
      .select("*")
      .in(
        "activity_id",
        courseActivities.map((ca) => ca.activity_id)
      )
      .eq("instructor_id", instructorId);

    if (error) {
      console.error("Error fetching projects:", error);
      return [];
    }

    console.log("Projects fetched:", data);
    return data || [];
  } catch (error) {
    console.error("Error in getInstructorProjects:", error);
    return [];
  }
}

// Render projects in the table
async function renderInstructorProjects(courseId) {
  try {
    console.log("Rendering projects for course ID:", courseId);

    // Clear existing projects and show loading state
    projectListBody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center;">Loading projects...</td>
      </tr>`;

    // Get projects for this course
    const projects = await getInstructorProjects(courseId);

    // Clear existing projects after data is loaded
    projectListBody.innerHTML = "";

    if (!projects || projects.length === 0) {
      projectListBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center;">No projects found for this course</td>
        </tr>`;

      // Even if no projects were found, we should still check for submissions
      renderStudentSubmissionsForCourse(courseId);
      return;
    }

    console.log(`Found ${projects.length} projects for course ${courseId}`);

    // Create HTML for each project
    projects.forEach((project, index) => {
      const row = document.createElement("tr");

      // Format the date properly
      const dueDate = new Date(project.activity_duedate);
      const formattedDate = dueDate.toLocaleDateString();

      row.innerHTML = `
        <td>
          <span class="project-number">${index + 1}</span> ${
        project.activity_title
      }
        </td>
        <td>${formattedDate}</td>
        <td><p class="show__project-details" data-id="${
          project.activity_id
        }">View</p></td>
      `;

      projectListBody.appendChild(row);
    });

    // Add event listeners to view buttons
    document.querySelectorAll(".show__project-details").forEach((button) => {
      button.addEventListener("click", () => {
        const activityId = button.getAttribute("data-id");
        showProjectDetails(activityId);
      });
    });

    // After rendering projects, render the student submissions for this course
    renderStudentSubmissionsForCourse(courseId);
  } catch (error) {
    console.error("Error in renderInstructorProjects:", error);
    projectListBody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center;">Error loading projects</td>
      </tr>`;
  }
}

// Show project details in a modal
async function showProjectDetails(activityId) {
  try {
    console.log("Showing details for project:", activityId);

    // Fetch project details
    const { data, error } = await supaClient
      .from("activity")
      .select("*")
      .eq("activity_id", activityId)
      .single();

    if (error) {
      console.error("Error fetching project details:", error);
      alert("Failed to load project details");
      return;
    }

    if (!data) {
      alert("Project not found");
      return;
    }

    // Create modal if it doesn't exist
    let modal = document.getElementById("projectDetailsModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "projectDetailsModal";
      modal.className = "modal";

      // Create modal content
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <h2 id="modal-title">Project Details</h2>
          <div id="modal-body">
            <div class="detail-row">
              <strong>Title:</strong>
              <span id="modal-project-title"></span>
            </div>
            <div class="detail-row">
              <strong>Description:</strong>
              <p id="modal-project-description"></p>
            </div>
            <div class="detail-row">
              <strong>Due Date:</strong>
              <span id="modal-project-duedate"></span>
            </div>
          </div>
        </div>
      `;

      // Add modal to the body
      document.body.appendChild(modal);

      const closeBtn = modal.querySelector(".close-modal");
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });

      // Close modal when clicking outside
      window.addEventListener("click", (event) => {
        if (event.target === modal) {
          modal.style.display = "none";
        }
      });
    }

    // Populate modal with project details
    document.getElementById("modal-title").textContent = "Project Details";
    document.getElementById("modal-project-title").textContent =
      data.activity_title;
    document.getElementById("modal-project-description").textContent =
      data.activity_description;

    // Format due date
    const dueDate = new Date(data.activity_duedate);
    const formattedDate = dueDate.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
    document.getElementById("modal-project-duedate").textContent =
      formattedDate;

    // Show the modal
    modal.style.display = "block";
  } catch (error) {
    console.error("Error showing project details:", error);
    alert("Failed to display project details");
  }
}

// Initialize the course dropdown and load projects
async function initializeProjectPage() {
  try {
    // Clear course dropdown
    courseNameSelect.innerHTML = "";

    // Get instructor courses
    const courses = await getInstructorCourses();

    if (!courses || courses.length === 0) {
      courseNameSelect.innerHTML = `<option value="">No courses available</option>`;
      projectListBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center;">No courses available</td>
        </tr>`;
      submissionListBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center;">No courses available</td>
        </tr>`;
      return;
    }

    // Reset the event listener to prevent duplicates
    const oldCourseNameSelect = courseNameSelect.cloneNode(false);
    courseNameSelect.parentNode.replaceChild(
      oldCourseNameSelect,
      courseNameSelect
    );
    courseNameSelect = document.getElementById("course-name"); // Reselect the element

    // Populate course dropdown
    courses.forEach((course) => {
      const option = document.createElement("option");
      option.value = course.course_id;
      option.textContent = course.course_name;
      courseNameSelect.appendChild(option);
    });

    // Get the first course ID as default
    const defaultCourseId = courses[0].course_id;

    // Set the dropdown to the default course
    courseNameSelect.value = defaultCourseId;

    // Display projects for the default course
    renderInstructorProjects(defaultCourseId);

    // Add event listener for course selection change
    courseNameSelect.addEventListener("change", (e) => {
      const selectedCourseId = e.target.value;
      console.log("Course changed to:", selectedCourseId);

      // Clear existing data
      projectListBody.innerHTML = `<tr><td colspan="3">Loading projects...</td></tr>`;
      submissionListBody.innerHTML = `<tr><td colspan="3">Loading submissions...</td></tr>`;

      // Fetch and render data specific to selected course
      renderInstructorProjects(selectedCourseId);
    });
  } catch (error) {
    console.error("Error initializing project page:", error);
  }
}

// Submit a new project
async function submitProject() {
  try {
    // Validate inputs
    const courseId = courseNameSelect.value;
    const title = projectTitleInput.value.trim();
    const description = projectDescriptionInput.value.trim();
    const dueDate = dueDateInput.value.trim();

    if (!courseId || !title || !description || !dueDate) {
      alert("Please fill in all fields");
      return;
    }

    // Parse date
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      alert("Please enter a valid date in the format mm/dd/yyyy --:-- --");
      return;
    }

    // Disable button to prevent multiple submissions
    submitProjectBtn.disabled = true;

    // Insert new project
    const { data: activityData, error: activityError } = await supaClient
      .from("activity")
      .insert([
        {
          instructor_id: instructorId,
          activity_title: title,
          activity_description: description,
          activity_duedate: parsedDate.toISOString(),
        },
      ])
      .select();

    if (activityError) {
      console.error("Error submitting project:", activityError);
      alert("Failed to submit project");
      submitProjectBtn.disabled = false;
      return;
    }

    // Now link this activity to the course
    const newActivityId = activityData[0].activity_id;
    const { error: linkError } = await supaClient
      .from("course_activity")
      .insert([
        {
          course_id: courseId,
          activity_id: newActivityId,
        },
      ]);

    if (linkError) {
      console.error("Error linking project to course:", linkError);
      alert("Project created but not linked to course");
      submitProjectBtn.disabled = false;
      return;
    }

    // Clear form
    projectTitleInput.value = "";
    projectDescriptionInput.value = "";
    dueDateInput.value = "";

    // Show success message
    successMessage.style.display = "block";
    setTimeout(() => {
      successMessage.style.display = "none";
    }, 3000);

    // Refresh project list
    renderInstructorProjects(courseId);

    // Re-enable button
    submitProjectBtn.disabled = false;
  } catch (error) {
    console.error("Error in submitProject:", error);
    alert("An error occurred while submitting the project");
    submitProjectBtn.disabled = false;
  }
}

// Add event listener for form submission
submitProjectBtn.addEventListener("click", submitProject);

///////////////////////  GET STUDENTS PROJECTS /////////////////////

// Get activity IDs for a specific course
async function getActivityIDsForCourse(courseId) {
  try {
    // First get activity IDs associated with this course
    const { data: courseActivities, error: courseActivitiesError } =
      await supaClient
        .from("course_activity")
        .select("activity_id")
        .eq("course_id", courseId);

    if (courseActivitiesError) {
      console.error("Error fetching course activities:", courseActivitiesError);
      return [];
    }

    // Then verify these activities belong to the instructor
    if (courseActivities && courseActivities.length > 0) {
      const { data, error } = await supaClient
        .from("activity")
        .select("activity_id")
        .in(
          "activity_id",
          courseActivities.map((ca) => ca.activity_id)
        )
        .eq("instructor_id", instructorId);

      if (error) {
        console.error("Error verifying instructor's activities:", error);
        return [];
      }

      return data || [];
    }

    return [];
  } catch (error) {
    console.error("Error in getActivityIDsForCourse:", error);
    return [];
  }
}

// Get student submissions for specific activities
async function getStudentSubmissionsForActivities(activityIds) {
  try {
    if (!activityIds || activityIds.length === 0) {
      return [];
    }

    const { data, error } = await supaClient
      .from("student_activity")
      .select("*")
      .in(
        "activity_id",
        activityIds.map((a) => a.activity_id)
      );

    if (error) {
      console.error("Error fetching student submissions:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getStudentSubmissionsForActivities:", error);
    return [];
  }
}

// Get activity details
async function getActivityDetails(activityIds) {
  try {
    if (!activityIds || activityIds.length === 0) {
      return [];
    }

    const { data, error } = await supaClient
      .from("activity")
      .select("*")
      .in("activity_id", activityIds);

    if (error) {
      console.error("Error fetching activity details:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getActivityDetails:", error);
    return [];
  }
}

// Get student details
async function getStudentDetails(studentIds) {
  try {
    if (!studentIds || studentIds.length === 0) {
      return [];
    }

    const { data, error } = await supaClient
      .from("student")
      .select("*")
      .in("student_id", studentIds);

    if (error) {
      console.error("Error fetching student details:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getStudentDetails:", error);
    return [];
  }
}

// Render student submissions for a specific course
async function renderStudentSubmissionsForCourse(courseId) {
  try {
    console.log("Rendering submissions for course ID:", courseId);

    // Clear existing submissions and show loading state
    submissionListBody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center;">Loading submissions...</td>
      </tr>`;

    // Get activity IDs for the selected course
    const activityIds = await getActivityIDsForCourse(courseId);

    if (!activityIds || activityIds.length === 0) {
      submissionListBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center;">No projects found for this course</td>
        </tr>`;
      return;
    }

    console.log("Found activity IDs:", activityIds);

    // Get student submissions for these activities
    const submissions = await getStudentSubmissionsForActivities(activityIds);

    if (!submissions || submissions.length === 0) {
      submissionListBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center;">No student submissions found for this course</td>
        </tr>`;
      return;
    }

    console.log("Found submissions:", submissions.length);

    // Get details for activities and students
    const activityDetails = await getActivityDetails([
      ...new Set(submissions.map((s) => s.activity_id)),
    ]);

    const studentDetails = await getStudentDetails([
      ...new Set(submissions.map((s) => s.student_id)),
    ]);

    console.log("Activity details:", activityDetails.length);
    console.log("Student details:", studentDetails.length);

    // Create HTML for each submission
    let markup = "";
    submissions.forEach((submission) => {
      const student = studentDetails.find(
        (s) => s.student_id === submission.student_id
      );
      const activity = activityDetails.find(
        (a) => a.activity_id === submission.activity_id
      );

      if (student && activity) {
        markup += `<tr>
                    <td>${student.student_name || "Unknown Student"}</td>
                    <td>${activity.activity_title || "Unknown Project"}</td>
                    <td><a target="_blank" href="${
                      submission.activity_path
                    }" class="view-submission-button">View</a></td>
                  </tr>`;
      }
    });

    submissionListBody.innerHTML =
      markup ||
      `
      <tr>
        <td colspan="3" style="text-align: center;">Could not display submissions properly</td>
      </tr>`;
  } catch (error) {
    console.error("Error in renderStudentSubmissionsForCourse:", error);
    submissionListBody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center;">Error loading student submissions</td>
      </tr>`;
  }
}

// Initialize the page only once when the DOM is loaded
let initialized = false;

document.addEventListener("DOMContentLoaded", () => {
  if (initialized) return;

  // Check if instructor ID exists
  if (!instructorId) {
    console.error("No instructor ID found in session storage");
    alert("Please log in as an instructor");
    window.location.href = "index.html"; // Redirect to login page
    return;
  }

  initializeProjectPage();
  initialized = true;
});
