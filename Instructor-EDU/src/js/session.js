// import { supaClient } from "./main.js";
// const pageTitle = document.querySelector(".page-title");
// const courseId = sessionStorage.getItem("courseId");
// const instructorId = sessionStorage.getItem("instructorId");
// const sessionContainer = document.querySelector(".sessions-container");
// const uploadButton = document.querySelector(".upload-btn");
// const uploadFrom = document.querySelector(".upload-from");
// uploadFrom.addEventListener("sumbit", uploadSession);

// async function getCoursesWithEnrollmentCounts(instructorId) {
//   // Step 1: Fetch all enrollments for this instructor
//   const { data: enrollments, error } = await supaClient
//     .from("enrollment")
//     .select("course_id") // only need course_id
//     .eq("instructor_id", instructorId);

//   if (error) {
//     console.error("Error fetching enrollments:", error);
//     return;
//   }

//   // Step 2: Get unique course_ids
//   const uniqueCourses = [...new Set(enrollments.map((e) => e.course_id))];

//   // Step 3: For each course_id, count number of students
//   const results = [];
//   for (let courseId of uniqueCourses) {
//     const { count, error: countError } = await supaClient
//       .from("enrollment")
//       .select("student_id", { count: "exact", head: true }) // count students
//       .eq("course_id", courseId)
//       .eq("instructor_id", instructorId);

//     if (countError) {
//       console.error(
//         `Error counting students for course ${courseId}:`,
//         countError
//       );
//     } else {
//       results.push({ course_id: courseId, student_count: count });
//     }
//   }
//   return results;
// }
// async function getSessions() {
//   const instructorCourses = await getCoursesWithEnrollmentCounts(instructorId);
//   const instructorCoursesID = instructorCourses.map((c) => c.course_id);
//   const { data, error } = await supaClient
//     .from("session")
//     .select("*")
//     .in(
//       "course_id",
//       instructorCoursesID.map((id) => id)
//     );
//   if (error) {
//     console.error("Error fetching sessions:", error);
//     return;
//   }
//   if (data) {
//     console.log("Sessions:", data);
//     return data;
//   }
// }
// async function getLectures() {
//   const sessions = await getSessions();
//   const lectures = sessions.filter(
//     (session) => session.session_type === "lecture"
//   );
//   lectures.sort((a, b) => new Date(a.session_time) - new Date(b.session_time));
//   console.log("lectures", lectures);
//   return lectures;
// }
// async function getSections() {
//   const sessions = await getSessions();
//   const sections = sessions.filter(
//     (session) => session.session_type === "section"
//   );
//   sections.sort((a, b) => new Date(a.session_time) - new Date(b.session_time));
//   console.log("sections", sections);
//   return sections;
// }
// async function renderSessions() {
//   let sectionCount = 0;
//   let lectureCount = 0;
//   const lectures = await getLectures();
//   const sections = await getSections();

//   let lectureMarkup = "";
//   let sectionMarkup = "";
//   const sessionNumber = document.querySelector("#session-number");
//   lectures.forEach((lecture) => {
//     lectureCount++;
//     lectureMarkup += `
//       <div class="session lecture">
//                 <p class="session__number"><span>${lectureCount}</span></p>
//                 <p class="session__date"><span>${new Date(
//                   lecture.session_time
//                 ).toLocaleDateString()}</span></p>
//                 <a class="session__file" target="_blank" href="${
//                   lecture.session_file_path
//                 }"> lecture ${lectureCount}</a>
//               </div>
//       `;
//   });
//   sections.forEach((section) => {
//     sectionCount++;
//     sectionMarkup += `
//       <div class="session section">
//                 <p class="session__number"><span>${sectionCount}</span></p>
//                 <p class="session__date"><span>${new Date(
//                   section.session_time
//                 ).toLocaleDateString()}</span></p>
//                 <a class="session__file" target="_blank" href="${
//                   section.session_file_path
//                 }"> section ${sectionCount}</a>
//               </div>
//       `;
//   });
//   sessionContainer.innerHTML = lectureMarkup + sectionMarkup;
// }
// renderSessions();

// async function renderFormData() {
//   const sessionNumber = document.querySelector("#session-number");
//   const courseName = document.querySelector("#course-name");
//   const sessionType = document.querySelector("#session-type");
//   const sessions = await getSessions();
//   sessionType.value = "lecture";
//   let lectureCount = 0;
//   let sectionCount = 0;
//   sessions.forEach((session) => {
//     if (session.session_type === "lecture") {
//       lectureCount++;
//     }
//     if (session.session_type === "section") {
//       sectionCount++;
//     }
//   });
//   if (sessionType.value === "lecture") {
//     sessionNumber.innerHTML = "";
//     for (let index = 0; index < lectureCount; index++) {
//       sessionNumber.innerHTML += `<option value="${index + 1}">${
//         index + 1
//       }</option>`;
//     }
//   }
//   sessionType.addEventListener("change", () => {
//     if (sessionType.value === "lecture") {
//       sessionNumber.innerHTML = "";
//       for (let index = 0; index < lectureCount; index++) {
//         sessionNumber.innerHTML += `<option value="${index + 1}">${
//           index + 1
//         }</option>`;
//       }
//     }
//     if (sessionType.value === "section") {
//       sessionNumber.innerHTML = "";
//       for (let index = 0; index < sectionCount; index++) {
//         sessionNumber.innerHTML += `<option value="${index + 1}">${
//           index + 1
//         }</option>`;
//       }
//     }
//   });
//   courseName.innerHTML = "";

//   const instructorCourses = await getCoursesWithEnrollmentCounts(instructorId);
//   const instructorCoursesID = instructorCourses.map((c) => c.course_id);

//   const { data, error } = await supaClient
//     .from("course")
//     .select("*")
//     .in(
//       "course_id",
//       instructorCoursesID.map((id) => id)
//     );
//   if (error) {
//     console.error(error);
//     return;
//   }
//   if (data) {
//     data.forEach((course) => {
//       courseName.innerHTML += `<option value="${course.course_name}">${course.course_name}</option>`;
//     });
//   }
// }
// renderFormData();

// async function uploadSession(e) {
//   e.preventDefault();
//   const sessionType = document.querySelector("#session-type").value;
//   const sessionNumber = +document.querySelector("#session-number").value;
//   const courseName = document.querySelector("#course-name").value;
//   const fileInput = document.querySelector("#file");
//   const sessionsToUpload =
//     sessionType === "lecture" ? await getLectures() : await getSections();
//   console.log("sessions yo upload", sessionsToUpload);
//   const sessionToUplaod = sessionsToUpload.find(
//     (_, index) => index + 1 === sessionNumber
//   );
//   console.log("session id", sessionToUplaod);
//   const sessionId = sessionToUplaod.session_id;
//   console.log("session id", sessionId);
//   const file = fileInput.files[0];
//   console.log("file", file);
//   if (fileInput.files.length === 1) {
//     const fileName = `${Math.random()}-${fileInput.files[0].name}`.replaceAll(
//       "/",
//       ""
//     );
//     const filePath = `https://iuiwdjtmdeempcqxeuhf.supabase.co/storage/v1/object/public/sessions/${fileName}`;
//     const { data, error } = await supaClient
//       .from("session")
//       .update({
//         session_file_path: filePath,
//       })
//       .eq("session_id", sessionId);
//     // 2 upload the session
//     if (!error) {
//       const { uploadError } = supaClient.storage
//         .from("sessions")
//         .upload(fileName, file);
//       if (uploadError) {
//         console.error(uploadError);
//         return;
//       }
//     }
//   }
//   renderSessions();
// }
// uploadButton.addEventListener("click", uploadSession);

//////////////// SECOND VISRION //////////////////
// import { supaClient } from "./main.js";
// const pageTitle = document.querySelector(".page-title");
// const courseId = sessionStorage.getItem("courseId");
// const instructorId = sessionStorage.getItem("instructorId");
// const sessionContainer = document.querySelector(".sessions-container");
// const uploadButton = document.querySelector(".upload-btn");
// const uploadFrom = document.querySelector(".upload-from");
// uploadFrom.addEventListener("sumbit", uploadSession);

// // Toast notification function
// function showToast(message, type = "success") {
//   // Create toast container if it doesn't exist
//   let toastContainer = document.querySelector(".toast-container");
//   if (!toastContainer) {
//     toastContainer = document.createElement("div");
//     toastContainer.className = "toast-container";
//     document.body.appendChild(toastContainer);
//   }

//   // Create and display toast
//   const toast = document.createElement("div");
//   toast.className = `toast ${type}`;
//   toast.innerHTML = `
//     <span>${message}</span>
//     <span class="toast-close">&times;</span>
//   `;

//   // Add click event to close toast
//   toast.addEventListener("click", () => {
//     toast.classList.add("toast-hiding");
//     setTimeout(() => toast.remove(), 300);
//   });

//   toastContainer.appendChild(toast);

//   // Auto-remove toast after 3 seconds
//   setTimeout(() => {
//     if (toast.parentNode) {
//       toast.classList.add("toast-hiding");
//       setTimeout(() => toast.remove(), 300);
//     }
//   }, 3000);
// }

// // Function to show loading spinner
// function showLoadingSpinner(button, isLoading = true) {
//   if (isLoading) {
//     const originalText = button.textContent;
//     button.setAttribute("data-original-text", originalText);
//     button.innerHTML = `
//       <span class="spinner"></span>
//       <span>Uploading...</span>
//     `;
//     button.disabled = true;
//   } else {
//     const originalText = button.getAttribute("data-original-text") || "Upload";
//     button.textContent = originalText;
//     button.disabled = false;
//   }
// }

// async function getCoursesWithEnrollmentCounts(instructorId) {
//   // Step 1: Fetch all enrollments for this instructor
//   const { data: enrollments, error } = await supaClient
//     .from("enrollment")
//     .select("course_id") // only need course_id
//     .eq("instructor_id", instructorId);

//   if (error) {
//     console.error("Error fetching enrollments:", error);
//     showToast("Error fetching enrollments", "error");
//     return;
//   }

//   // Step 2: Get unique course_ids
//   const uniqueCourses = [...new Set(enrollments.map((e) => e.course_id))];

//   // Step 3: For each course_id, count number of students
//   const results = [];
//   for (let courseId of uniqueCourses) {
//     const { count, error: countError } = await supaClient
//       .from("enrollment")
//       .select("student_id", { count: "exact", head: true }) // count students
//       .eq("course_id", courseId)
//       .eq("instructor_id", instructorId);

//     if (countError) {
//       console.error(
//         `Error counting students for course ${courseId}:`,
//         countError
//       );
//     } else {
//       results.push({ course_id: courseId, student_count: count });
//     }
//   }
//   return results;
// }
// async function getSessions(courseId = null) {
//   const instructorCourses = await getCoursesWithEnrollmentCounts(instructorId);
//   console.log("instructorCourses", instructorCourses);
//   const instructorCoursesID = instructorCourses.map((c) => c.course_id);
//   const { data, error } = await supaClient
//     .from("session")
//     .select("*")
//     .in("course_id", courseId ?? instructorCoursesID.map((id) => id));
//   if (error) {
//     console.error("Error fetching sessions:", error);
//     showToast("Error fetching sessions", "error");
//     return;
//   }
//   if (data) {
//     console.log("Sessions:", data);
//     return data;
//   }
// }
// async function getLectures() {
//   const sessions = await getSessions();
//   const lectures = sessions.filter(
//     (session) => session.session_type === "lecture"
//   );
//   lectures.sort((a, b) => new Date(a.session_time) - new Date(b.session_time));
//   console.log("lectures", lectures);
//   return lectures;
// }
// async function getSections() {
//   const sessions = await getSessions();
//   const sections = sessions.filter(
//     (session) => session.session_type === "section"
//   );
//   sections.sort((a, b) => new Date(a.session_time) - new Date(b.session_time));
//   console.log("sections", sections);
//   return sections;
// }
// async function renderSessions() {
//   // Show loading state
//   sessionContainer.innerHTML = `
//     <div class="loading-sessions" style="text-align: center; padding: 20px;">
//       <div class="spinner" style="margin: 0 auto;"></div>
//       <p>Loading sessions...</p>
//     </div>
//   `;

//   let sectionCount = 0;
//   let lectureCount = 0;
//   const lectures = await getLectures();
//   const sections = await getSections();

//   let lectureMarkup = "";
//   let sectionMarkup = "";
//   const sessionNumber = document.querySelector("#session-number");
//   lectures.forEach((lecture) => {
//     lectureCount++;
//     lectureMarkup += `
//       <div class="session lecture">
//                 <p class="session__number"><span>${lectureCount}</span></p>
//                 <p class="session__date"><span>${new Date(
//                   lecture.session_time
//                 ).toLocaleDateString()}</span></p>
//                 <a class="session__file" target="_blank" href="${
//                   lecture.session_file_path
//                 }"> lecture ${lectureCount}</a>
//               </div>
//       `;
//   });
//   sections.forEach((section) => {
//     sectionCount++;
//     sectionMarkup += `
//       <div class="session section">
//                 <p class="session__number"><span>${sectionCount}</span></p>
//                 <p class="session__date"><span>${new Date(
//                   section.session_time
//                 ).toLocaleDateString()}</span></p>
//                 <a class="session__file" target="_blank" href="${
//                   section.session_file_path
//                 }"> section ${sectionCount}</a>
//               </div>
//       `;
//   });
//   sessionContainer.innerHTML = lectureMarkup + sectionMarkup;
// }
// renderSessions();

// async function renderFormData() {
//   const sessionNumber = document.querySelector("#session-number");
//   const courseName = document.querySelector("#course-name");
//   const sessionType = document.querySelector("#session-type");
//   let courseId;

//   sessionType.value = "lecture";
//   let lectureCount = 0;
//   let sectionCount = 0;
//   const sessions = await getSessions();

//   sessionType.addEventListener("change", () => {
//     if (sessionType.value === "lecture") {
//       sessionNumber.innerHTML = "";
//       for (let index = 0; index < lectureCount; index++) {
//         sessionNumber.innerHTML += `<option value="${index + 1}">${
//           index + 1
//         }</option>`;
//       }
//     }
//     if (sessionType.value === "section") {
//       sessionNumber.innerHTML = "";
//       for (let index = 0; index < sectionCount; index++) {
//         sessionNumber.innerHTML += `<option value="${index + 1}">${
//           index + 1
//         }</option>`;
//       }
//       sessions.forEach((session) => {
//         if (session.session_type === "lecture") {
//           lectureCount++;
//         }
//         if (session.session_type === "section") {
//           sectionCount++;
//         }
//       });
//       if (sessionType.value === "lecture") {
//         sessionNumber.innerHTML = "";
//         for (let index = 0; index < lectureCount; index++) {
//           sessionNumber.innerHTML += `<option value="${index + 1}">${
//             index + 1
//           }</option>`;
//         }
//       }
//     }
//   });
//   courseName.innerHTML = "";

//   const instructorCourses = await getCoursesWithEnrollmentCounts(instructorId);
//   const instructorCoursesID = instructorCourses.map((c) => c.course_id);

//   const { data, error } = await supaClient
//     .from("course")
//     .select("*")
//     .in(
//       "course_id",
//       instructorCoursesID.map((id) => id)
//     );
//   if (error) {
//     console.error(error);
//     showToast("Error loading courses", "error");
//     return;
//   }
//   if (data) {
//     data.forEach((course) => {
//       courseName.innerHTML += `<option value="${course.course_id}">${course.course_name}</option>`;
//     });
//     // courseId = data[0].course_id;
//     courseId = courseName.value;
//     console.log(+courseId);
//   }
// }
// renderFormData();

// // Enhanced file input handling
// const fileInput = document.querySelector("#file");
// const fileUploadArea = document.querySelector(".custum-file-upload");
// let filePreviewArea;

// // Create file preview area if it doesn't exist
// if (!document.querySelector(".file-preview")) {
//   filePreviewArea = document.createElement("div");
//   filePreviewArea.className = "file-preview";
//   filePreviewArea.style.display = "none";
//   fileUploadArea.parentNode.insertBefore(
//     filePreviewArea,
//     fileUploadArea.nextSibling
//   );
// } else {
//   filePreviewArea = document.querySelector(".file-preview");
// }

// // Handle file selection
// fileInput.addEventListener("change", (e) => {
//   if (e.target.files && e.target.files.length > 0) {
//     const file = e.target.files[0];
//     const fileName = file.name;
//     const fileSize = (file.size / 1024).toFixed(2);

//     // Show file icon based on type
//     let fileIcon = "fi-rr-file";
//     if (typeof fileName === "string") {
//       const fileExt = fileName.split(".").pop().toLowerCase();

//       if (fileExt === "pdf") {
//         fileIcon = "fi-rr-file-pdf";
//       } else if (["doc", "docx"].includes(fileExt)) {
//         fileIcon = "fi-rr-file-word";
//       } else if (["xls", "xlsx"].includes(fileExt)) {
//         fileIcon = "fi-rr-file-excel";
//       } else if (["ppt", "pptx"].includes(fileExt)) {
//         fileIcon = "fi-rr-file-powerpoint";
//       } else if (["jpg", "jpeg", "png", "gif"].includes(fileExt)) {
//         fileIcon = "fi-rr-file-image";
//       } else if (["zip", "rar", "7z"].includes(fileExt)) {
//         fileIcon = "fi-rr-file-archive";
//       }
//     }

//     filePreviewArea.innerHTML = `
//       <div class="file-info">
//         <i class="fi ${fileIcon}" style="color: var(--color-primary); font-size: 18px;"></i>
//         <span class="file-name">${fileName}</span>
//         <span class="file-size">(${fileSize} KB)</span>
//         <span class="remove-file">✕</span>
//       </div>
//     `;

//     filePreviewArea.style.display = "block";
//     fileUploadArea.style.borderColor = "#4CAF50";
//     fileUploadArea.style.backgroundColor = "rgba(76, 175, 80, 0.05)";

//     // Add event listener to remove file button
//     const removeBtn = filePreviewArea.querySelector(".remove-file");
//     removeBtn.addEventListener("click", (event) => {
//       event.stopPropagation();
//       fileInput.value = "";
//       filePreviewArea.style.display = "none";
//       fileUploadArea.style.borderColor = "var(--color-primary)";
//       fileUploadArea.style.backgroundColor = "rgba(255, 255, 255, 1)";
//     });
//   } else {
//     filePreviewArea.style.display = "none";
//     fileUploadArea.style.borderColor = "var(--color-primary)";
//     fileUploadArea.style.backgroundColor = "rgba(255, 255, 255, 1)";
//   }
// });

// // Drag and drop events
// fileUploadArea.addEventListener("dragover", (e) => {
//   e.preventDefault();
//   fileUploadArea.style.borderColor = "var(--color-primary-dark)";
//   fileUploadArea.style.backgroundColor = "rgba(89, 85, 179, 0.15)";
// });

// fileUploadArea.addEventListener("dragleave", (e) => {
//   e.preventDefault();
//   fileUploadArea.style.borderColor = "var(--color-primary)";
//   fileUploadArea.style.backgroundColor = "rgba(255, 255, 255, 1)";
// });

// fileUploadArea.addEventListener("drop", (e) => {
//   e.preventDefault();
//   fileUploadArea.style.borderColor = "var(--color-primary)";
//   fileUploadArea.style.backgroundColor = "rgba(255, 255, 255, 1)";

//   if (e.dataTransfer.files.length) {
//     fileInput.files = e.dataTransfer.files;
//     fileInput.dispatchEvent(new Event("change"));
//   }
// });

// /*************  ✨ Windsurf Command ⭐  *************/
// /**
//  * Handles the upload of a session file.
//  * @param {Event} e The submit event that triggered this function.
//  * @returns {Promise<void>}
//  */
// /*******  28fdc0b8-ebe8-42da-934a-0f199090749e  *******/
// async function uploadSession(e) {
//   e.preventDefault();
//   const sessionType = document.querySelector("#session-type").value;
//   const sessionNumber = +document.querySelector("#session-number").value;
//   const courseName = document.querySelector("#course-name").value;
//   const fileInput = document.querySelector("#file");

//   if (!fileInput.files || fileInput.files.length === 0) {
//     showToast("Please select a file to upload", "warning");
//     return;
//   }

//   // Show loading state
//   showLoadingSpinner(uploadButton, true);

//   try {
//     const sessionsToUpload =
//       sessionType === "lecture" ? await getLectures() : await getSections();
//     console.log("sessions to upload", sessionsToUpload);
//     const sessionToUplaod = sessionsToUpload.find(
//       (_, index) => index + 1 === sessionNumber
//     );

//     if (!sessionToUplaod) {
//       showToast("Session not found", "error");
//       showLoadingSpinner(uploadButton, false);
//       return;
//     }

//     console.log("session id", sessionToUplaod);
//     const sessionId = sessionToUplaod.session_id;
//     console.log("session id", sessionId);
//     const file = fileInput.files[0];
//     console.log("file", file);

//     if (fileInput.files.length === 1) {
//       const fileName = `${Math.random()}-${fileInput.files[0].name}`.replaceAll(
//         "/",
//         ""
//       );
//       const filePath = `https://iuiwdjtmdeempcqxeuhf.supabase.co/storage/v1/object/public/sessions/${fileName}`;

//       const { data, error } = await supaClient
//         .from("session")
//         .update({
//           session_file_path: filePath,
//         })
//         .eq("session_id", sessionId);

//       if (error) {
//         console.error("Error updating session:", error);
//         showToast("Failed to update session", "error");
//         showLoadingSpinner(uploadButton, false);
//         return;
//       }

//       // 2 upload the session
//       const { error: uploadError } = await supaClient.storage
//         .from("sessions")
//         .upload(fileName, file);

//       if (uploadError) {
//         console.error(uploadError);
//         showToast("Failed to upload file", "error");
//         showLoadingSpinner(uploadButton, false);
//         return;
//       }

//       // Success case
//       showToast(
//         `${sessionType} ${sessionNumber} uploaded successfully!`,
//         "success"
//       );

//       // Reset the file input and preview
//       fileInput.value = "";
//       filePreviewArea.style.display = "none";
//       fileUploadArea.style.borderColor = "var(--color-primary)";
//       fileUploadArea.style.backgroundColor = "rgba(255, 255, 255, 1)";

//       // Refresh sessions display
//       renderSessions();
//     }
//   } catch (error) {
//     console.error("Unexpected error during upload:", error);
//     showToast("An unexpected error occurred. Please try again.", "error");
//   } finally {
//     showLoadingSpinner(uploadButton, false);
//   }
// }

// uploadButton.addEventListener("click", uploadSession);

// // Add font awesome icon link if not already present
// if (!document.querySelector('link[href*="fontawesome"]')) {
//   const fontAwesomeLink = document.createElement("link");
//   fontAwesomeLink.rel = "stylesheet";
//   fontAwesomeLink.href =
//     "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
//   document.head.appendChild(fontAwesomeLink);
// }

/////////////////// THIRD VIRSION ///////////////////
import { supaClient } from "./main.js";
const pageTitle = document.querySelector(".page-title");
const courseId = sessionStorage.getItem("courseId");
const instructorId = sessionStorage.getItem("instructorId");
const sessionContainer = document.querySelector(".sessions-container");
const uploadButton = document.querySelector(".upload-btn");
const uploadFrom = document.querySelector(".upload-from");
uploadFrom.addEventListener("submit", uploadSession); // Fixed typo in "submit"

// Toast notification function
function showToast(message, type = "success") {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Create and display toast
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <span class="toast-close">&times;</span>
  `;

  // Add click event to close toast
  toast.addEventListener("click", () => {
    toast.classList.add("toast-hiding");
    setTimeout(() => toast.remove(), 300);
  });

  toastContainer.appendChild(toast);

  // Auto-remove toast after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add("toast-hiding");
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
}

// Function to show loading spinner
function showLoadingSpinner(button, isLoading = true) {
  if (isLoading) {
    const originalText = button.textContent;
    button.setAttribute("data-original-text", originalText);
    button.innerHTML = `
      <span class="spinner"></span>
      <span>Uploading...</span>
    `;
    button.disabled = true;
  } else {
    const originalText = button.getAttribute("data-original-text") || "Upload";
    button.textContent = originalText;
    button.disabled = false;
  }
}

async function getCoursesWithEnrollmentCounts(instructorId) {
  // Step 1: Fetch all enrollments for this instructor
  const { data: enrollments, error } = await supaClient
    .from("enrollment")
    .select("course_id") // only need course_id
    .eq("instructor_id", instructorId);

  if (error) {
    console.error("Error fetching enrollments:", error);
    showToast("Error fetching enrollments", "error");
    return;
  }

  // Step 2: Get unique course_ids
  const uniqueCourses = [...new Set(enrollments.map((e) => e.course_id))];

  // Step 3: For each course_id, count number of students
  const results = [];
  for (let courseId of uniqueCourses) {
    const { count, error: countError } = await supaClient
      .from("enrollment")
      .select("student_id", { count: "exact", head: true }) // count students
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
}

// Modified to accept a specific courseId
async function getSessions(courseId) {
  if (!courseId) {
    const instructorCourses = await getCoursesWithEnrollmentCounts(
      instructorId
    );
    console.log("instructorCourses", instructorCourses);

    if (instructorCourses && instructorCourses.length > 0) {
      // Use the first course if no specific course is selected
      courseId = instructorCourses[0].course_id;
    } else {
      console.error("No courses found for this instructor");
      showToast("No courses found", "error");
      return [];
    }
  }

  console.log("Fetching sessions for course ID:", courseId);

  const { data, error } = await supaClient
    .from("session")
    .select("*")
    .eq("course_id", courseId);

  if (error) {
    console.error("Error fetching sessions:", error);
    showToast("Error fetching sessions", "error");
    return [];
  }

  console.log("Sessions:", data);
  return data || [];
}

// Modified to accept a specific courseId
async function getLectures(courseId) {
  const sessions = await getSessions(courseId);
  const lectures = sessions.filter(
    (session) => session.session_type === "lecture"
  );
  lectures.sort((a, b) => new Date(a.session_time) - new Date(b.session_time));
  console.log("lectures", lectures);
  return lectures;
}

// Modified to accept a specific courseId
async function getSections(courseId) {
  const sessions = await getSessions(courseId);
  const sections = sessions.filter(
    (session) => session.session_type === "section"
  );
  sections.sort((a, b) => new Date(a.session_time) - new Date(b.session_time));
  console.log("sections", sections);
  return sections;
}

// Modified to accept a specific courseId
async function renderSessions(courseId) {
  // Show loading state
  sessionContainer.innerHTML = `
    <div class="loading-sessions" style="text-align: center; padding: 20px;">
      <div class="spinner" style="margin: 0 auto;"></div>
      <p>Loading sessions...</p>
    </div>
  `;

  let sectionCount = 0;
  let lectureCount = 0;
  const lectures = await getLectures(courseId);
  const sections = await getSections(courseId);

  let lectureMarkup = "";
  let sectionMarkup = "";

  if (lectures.length === 0 && sections.length === 0) {
    sessionContainer.innerHTML = `
      <div class="no-sessions" style="text-align: center; padding: 20px;">
        <p>No sessions found for this course.</p>
      </div>
    `;
    return;
  }

  lectures.forEach((lecture) => {
    lectureCount++;
    lectureMarkup += `
      <div class="session lecture">
                <p class="session__number"><span>${lectureCount}</span></p>
                <p class="session__date"><span>${new Date(
                  lecture.session_time
                ).toLocaleDateString()}</span></p>
                <a class="session__file" target="_blank" href="${
                  lecture.session_file_path
                }"> lecture ${lectureCount}</a>
              </div>
      `;
  });
  sections.forEach((section) => {
    sectionCount++;
    sectionMarkup += `
      <div class="session section">
                <p class="session__number"><span>${sectionCount}</span></p>
                <p class="session__date"><span>${new Date(
                  section.session_time
                ).toLocaleDateString()}</span></p>
                <a class="session__file" target="_blank" href="${
                  section.session_file_path
                }"> section ${sectionCount}</a>
              </div>
      `;
  });
  sessionContainer.innerHTML = lectureMarkup + sectionMarkup;

  // Update session numbers in the form based on the current course
  updateSessionNumbers(courseId);
}

// New function to update session numbers in the dropdown based on course and session type
async function updateSessionNumbers(courseId, sessionTypeValue = "lecture") {
  const sessionNumber = document.querySelector("#session-number");
  const sessionType = document.querySelector("#session-type");

  sessionNumber.innerHTML = "";

  let count = 0;
  if (sessionTypeValue === "lecture") {
    const lectures = await getLectures(courseId);
    count = lectures.length;
  } else {
    const sections = await getSections(courseId);
    count = sections.length;
  }

  // If no sessions found, add a placeholder option
  if (count === 0) {
    sessionNumber.innerHTML = `<option value="">No ${sessionTypeValue}s available</option>`;
  } else {
    // Add options for each session
    for (let i = 0; i < count; i++) {
      sessionNumber.innerHTML += `<option value="${i + 1}">${i + 1}</option>`;
    }
  }
}

async function renderFormData() {
  const sessionNumber = document.querySelector("#session-number");
  const courseName = document.querySelector("#course-name");
  const sessionType = document.querySelector("#session-type");

  courseName.innerHTML = "";
  sessionType.value = "lecture";

  // Get instructor courses
  const instructorCourses = await getCoursesWithEnrollmentCounts(instructorId);
  if (!instructorCourses || instructorCourses.length === 0) {
    showToast("No courses found for this instructor", "warning");
    return;
  }

  const instructorCoursesID = instructorCourses.map((c) => c.course_id);

  // Get course details
  const { data, error } = await supaClient
    .from("course")
    .select("*")
    .in("course_id", instructorCoursesID);

  if (error) {
    console.error("Error loading courses:", error);
    showToast("Error loading courses", "error");
    return;
  }

  if (data && data.length > 0) {
    // Add course options to dropdown
    data.forEach((course) => {
      courseName.innerHTML += `<option value="${course.course_id}">${course.course_name}</option>`;
    });

    // Get the first course ID as default
    const defaultCourseId = data[0].course_id;

    // Set initial session numbers based on default course
    updateSessionNumbers(defaultCourseId, "lecture");

    // Display sessions for the default course
    renderSessions(defaultCourseId);

    // Add event listener for course selection change
    courseName.addEventListener("change", (e) => {
      const selectedCourseId = e.target.value;
      renderSessions(selectedCourseId);
      updateSessionNumbers(selectedCourseId, sessionType.value);
    });

    // Add event listener for session type change
    sessionType.addEventListener("change", (e) => {
      const selectedSessionType = e.target.value;
      const selectedCourseId = courseName.value;
      updateSessionNumbers(selectedCourseId, selectedSessionType);
    });
  } else {
    showToast("No courses found", "warning");
  }
}

// Enhanced file input handling
const fileInput = document.querySelector("#file");
const fileUploadArea = document.querySelector(".custum-file-upload");
let filePreviewArea;

// Create file preview area if it doesn't exist
if (!document.querySelector(".file-preview")) {
  filePreviewArea = document.createElement("div");
  filePreviewArea.className = "file-preview";
  filePreviewArea.style.display = "none";
  fileUploadArea.parentNode.insertBefore(
    filePreviewArea,
    fileUploadArea.nextSibling
  );
} else {
  filePreviewArea = document.querySelector(".file-preview");
}

// Handle file selection
fileInput.addEventListener("change", (e) => {
  if (e.target.files && e.target.files.length > 0) {
    const file = e.target.files[0];
    const fileName = file.name;
    const fileSize = (file.size / 1024).toFixed(2);

    // Show file icon based on type
    let fileIcon = "fi-rr-file";
    if (typeof fileName === "string") {
      const fileExt = fileName.split(".").pop().toLowerCase();

      if (fileExt === "pdf") {
        fileIcon = "fi-rr-file-pdf";
      } else if (["doc", "docx"].includes(fileExt)) {
        fileIcon = "fi-rr-file-word";
      } else if (["xls", "xlsx"].includes(fileExt)) {
        fileIcon = "fi-rr-file-excel";
      } else if (["ppt", "pptx"].includes(fileExt)) {
        fileIcon = "fi-rr-file-powerpoint";
      } else if (["jpg", "jpeg", "png", "gif"].includes(fileExt)) {
        fileIcon = "fi-rr-file-image";
      } else if (["zip", "rar", "7z"].includes(fileExt)) {
        fileIcon = "fi-rr-file-archive";
      }
    }

    filePreviewArea.innerHTML = `
      <div class="file-info">
        <i class="fi ${fileIcon}" style="color: var(--color-primary); font-size: 18px;"></i>
        <span class="file-name">${fileName}</span>
        <span class="file-size">(${fileSize} KB)</span>
        <span class="remove-file">✕</span>
      </div>
    `;

    filePreviewArea.style.display = "block";
    fileUploadArea.style.borderColor = "#4CAF50";
    fileUploadArea.style.backgroundColor = "rgba(76, 175, 80, 0.05)";

    // Add event listener to remove file button
    const removeBtn = filePreviewArea.querySelector(".remove-file");
    removeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      fileInput.value = "";
      filePreviewArea.style.display = "none";
      fileUploadArea.style.borderColor = "var(--color-primary)";
      fileUploadArea.style.backgroundColor = "rgba(255, 255, 255, 1)";
    });
  } else {
    filePreviewArea.style.display = "none";
    fileUploadArea.style.borderColor = "var(--color-primary)";
    fileUploadArea.style.backgroundColor = "rgba(255, 255, 255, 1)";
  }
});

// Drag and drop events
fileUploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  fileUploadArea.style.borderColor = "var(--color-primary-dark)";
  fileUploadArea.style.backgroundColor = "rgba(89, 85, 179, 0.15)";
});

fileUploadArea.addEventListener("dragleave", (e) => {
  e.preventDefault();
  fileUploadArea.style.borderColor = "var(--color-primary)";
  fileUploadArea.style.backgroundColor = "rgba(255, 255, 255, 1)";
});

fileUploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  fileUploadArea.style.borderColor = "var(--color-primary)";
  fileUploadArea.style.backgroundColor = "rgba(255, 255, 255, 1)";

  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event("change"));
  }
});

/**
 * Handles the upload of a session file.
 * @param {Event} e The submit event that triggered this function.
 * @returns {Promise<void>}
 */
async function uploadSession(e) {
  e.preventDefault();
  const sessionType = document.querySelector("#session-type").value;
  const sessionNumber = +document.querySelector("#session-number").value;
  const selectedCourseId = document.querySelector("#course-name").value;
  const fileInput = document.querySelector("#file");

  if (!fileInput.files || fileInput.files.length === 0) {
    showToast("Please select a file to upload", "warning");
    return;
  }

  if (!sessionNumber) {
    showToast("No session available for upload", "warning");
    return;
  }

  // Show loading state
  showLoadingSpinner(uploadButton, true);

  try {
    const sessionsToUpload =
      sessionType === "lecture"
        ? await getLectures(selectedCourseId)
        : await getSections(selectedCourseId);

    console.log("sessions to upload", sessionsToUpload);
    const sessionToUplaod = sessionsToUpload.find(
      (_, index) => index + 1 === sessionNumber
    );

    if (!sessionToUplaod) {
      showToast("Session not found", "error");
      showLoadingSpinner(uploadButton, false);
      return;
    }

    console.log("session id", sessionToUplaod);
    const sessionId = sessionToUplaod.session_id;
    console.log("session id", sessionId);
    const file = fileInput.files[0];
    console.log("file", file);

    if (fileInput.files.length === 1) {
      const fileName = `${Math.random()}-${fileInput.files[0].name}`.replaceAll(
        "/",
        ""
      );
      const filePath = `https://iuiwdjtmdeempcqxeuhf.supabase.co/storage/v1/object/public/sessions/${fileName}`;

      const { data, error } = await supaClient
        .from("session")
        .update({
          session_file_path: filePath,
        })
        .eq("session_id", sessionId);

      if (error) {
        console.error("Error updating session:", error);
        showToast("Failed to update session", "error");
        showLoadingSpinner(uploadButton, false);
        return;
      }

      // 2 upload the session
      const { error: uploadError } = await supaClient.storage
        .from("sessions")
        .upload(fileName, file);

      if (uploadError) {
        console.error(uploadError);
        showToast("Failed to upload file", "error");
        showLoadingSpinner(uploadButton, false);
        return;
      }

      // Success case
      showToast(
        `${sessionType} ${sessionNumber} uploaded successfully!`,
        "success"
      );

      // Reset the file input and preview
      fileInput.value = "";
      filePreviewArea.style.display = "none";
      fileUploadArea.style.borderColor = "var(--color-primary)";
      fileUploadArea.style.backgroundColor = "rgba(255, 255, 255, 1)";

      // Refresh sessions display with the current course
      renderSessions(selectedCourseId);
    }
  } catch (error) {
    console.error("Unexpected error during upload:", error);
    showToast("An unexpected error occurred. Please try again.", "error");
  } finally {
    showLoadingSpinner(uploadButton, false);
  }
}

uploadButton.addEventListener("click", uploadSession);

// Initialize the form data
renderFormData();

// Add font awesome icon link if not already present
if (!document.querySelector('link[href*="fontawesome"]')) {
  const fontAwesomeLink = document.createElement("link");
  fontAwesomeLink.rel = "stylesheet";
  fontAwesomeLink.href =
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
  document.head.appendChild(fontAwesomeLink);
}
