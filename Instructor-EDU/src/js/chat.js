import { supaClient } from "./main.js";
import { getInstructorName } from "./main.js";

// Get instructor ID from session storage
const instructorId = sessionStorage.getItem("instructorId");

// UI Elements
const chatName = document.querySelector(".chat__name");
const chats = document.querySelector(".chats");
const collapseButton = document.querySelector(".collapse__chat-btn");
const chatView = document.querySelector(".chat__view");
const chatListContainer = document.querySelector(".chats__list");
const chatImgEl = document.querySelector(".chat__img img");

// Chat state variables
let currentChatId = null;
let subscription = null;
let processedMessageIds = new Set();
let userNameCache = new Map();
let userChats = [];
let chatSubscriptions = {};

// Connection state tracking
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;

// Prefetch and cache the current instructor's name
if (instructorId) {
  getInstructorName(instructorId)
    .then((name) => {
      userNameCache.set(instructorId, name);
    })
    .catch(() => {
      userNameCache.set(instructorId, "Unknown Instructor");
    });
}

// Function to handle opening a chat if redirected from courses page
async function openIfClickedFromCourse() {
  const courseId = JSON.parse(sessionStorage.getItem("courseId"));
  if (courseId && isUserComingFrom("courses.html")) {
    const chatName = await getCourseName(courseId);
    openChatByName(chatName);
    sessionStorage.setItem("courseId", null);
  }
}

// Helper function to check if user is coming from a specific page
function isUserComingFrom(page) {
  return document.referrer.includes(page);
}

// Get course name from course ID
async function getCourseName(courseId) {
  try {
    const { data, error } = await supaClient
      .from("course")
      .select("course_name")
      .eq("course_id", courseId)
      .single();

    if (error) throw error;
    return data.course_name;
  } catch (error) {
    console.error("Error getting course name:", error);
    return "Unknown Course";
  }
}

// Function to open a chat by name
async function openChatByName(name) {
  try {
    const chatItem = document.querySelector(
      `.chat__item[data-chat-name="${name}"]`
    );
    if (chatItem) {
      chatItem.click();
    }
  } catch (error) {
    console.error("Error opening chat by name:", error);
  }
}

// Check if we need to open a specific chat
openIfClickedFromCourse();

// Chat search functionality
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.querySelector(".chats__search");
  const chatsList = document.querySelector(".chats__list");

  // Function to handle search
  function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    const chatItems = document.querySelectorAll(".chat__item");

    if (chatItems.length === 0) {
      // No chat items loaded yet
      return;
    }

    // Show all chats if search term is empty
    if (searchTerm === "") {
      chatItems.forEach((item) => {
        item.style.display = "flex";
      });
      return;
    }

    // Filter chats based on search term
    chatItems.forEach((item) => {
      const chatName = item
        .querySelector(".chat__name")
        .textContent.toLowerCase();

      // If chat preview text exists, include it in the search
      const chatPreview = item.querySelector(".chat__preview")
        ? item.querySelector(".chat__preview").textContent.toLowerCase()
        : "";

      if (chatName.includes(searchTerm) || chatPreview.includes(searchTerm)) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  }

  // Add event listener for search input
  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
    // Add clear search functionality
    searchInput.addEventListener("search", function () {
      handleSearch({ target: searchInput });
    });
  }

  // Add custom clear button for search
  const inputGroup = searchInput?.closest(".input__group");
  if (inputGroup) {
    // Create custom clear button
    const clearButton = document.createElement("button");
    clearButton.className = "search__clear-btn";
    clearButton.innerHTML = "×";
    clearButton.style.display = "none"; // Hide initially

    // Insert the button into the DOM
    inputGroup.appendChild(clearButton);

    // Style the button with inline styles
    Object.assign(clearButton.style, {
      position: "absolute",
      right: "6rem",
      background: "none",
      border: "none",
      fontSize: "2.8rem",
      cursor: "pointer",
      color: "#999aaa",
    });

    // Show/hide the clear button based on input content
    searchInput.addEventListener("input", function () {
      clearButton.style.display = this.value ? "block" : "none";
    });

    // Clear the input when button is clicked
    clearButton.addEventListener("click", function () {
      searchInput.value = "";
      clearButton.style.display = "none";
      searchInput.focus();

      // Trigger the search event to update results
      const event = new Event("input");
      searchInput.dispatchEvent(event);
    });
  }
});
// Improved safeGetUserName function with better error handling and caching
// async function safeGetUserName(userId) {
//   if (!userId) {
//     return "Unknown User";
//   }

//   // Check cache first for performance
//   if (userNameCache.has(userId)) {
//     return userNameCache.get(userId);
//   }

//   try {
//     // If current user, just label as "You" but don't cache it that way
//     if (Number(userId) === Number(instructorId)) {
//       const name = await getInstructorName(instructorId);
//       userNameCache.set(userId, name || "Unknown Instructor");
//       return "You";
//     }

//     // Try instructor table first
//     try {
//       const name = await getInstructorName(userId);
//       if (name) {
//         userNameCache.set(userId, name);
//         return name;
//       }
//     } catch (e) {
//       console.log(
//         `User ${userId} not found in instructor table, trying student table`
//       );
//     }

//     // If not an instructor, try student table
//     try {
//       const studentName = await getStudentName(userId);
//       if (studentName) {
//         userNameCache.set(userId, studentName);
//         return studentName;
//       }
//     } catch (e) {
//       console.log(`User ${userId} not found in student table either`);
//     }

//     // If we got here, we couldn't find the user
//     userNameCache.set(userId, "Unknown User");
//     return "Unknown User";
//   } catch (error) {
//     console.error(`Error getting username for ID ${userId}:`, error);
//     userNameCache.set(userId, "Unknown User");
//     return "Unknown User";
//   }
// }
async function safeGetUserName(userId) {
  if (!userId) {
    return "Unknown User";
  }

  // Check cache first for performance
  if (userNameCache.has(userId)) {
    return userNameCache.get(userId);
  }

  try {
    // If current user, just label as "You" but don't cache it that way
    if (Number(userId) === Number(instructorId)) {
      const name = await getInstructorName(instructorId);
      userNameCache.set(userId, name || "Unknown Instructor");
      return "You";
    }

    // Try student table first since the issue is with student names
    try {
      const studentName = await getStudentName(userId);
      if (studentName) {
        userNameCache.set(userId, studentName);
        return studentName;
      }
    } catch (e) {
      console.log(
        `User ${userId} not found in student table, trying instructor table`
      );
    }

    // If not a student, try instructor table
    try {
      const name = await getInstructorName(userId);
      if (name) {
        userNameCache.set(userId, name);
        return name;
      }
    } catch (e) {
      console.log(`User ${userId} not found in instructor table either`);
    }

    // If we got here, we couldn't find the user
    userNameCache.set(userId, "Unknown User");
    return "Unknown User";
  } catch (error) {
    console.error(`Error getting username for ID ${userId}:`, error);
    userNameCache.set(userId, "Unknown User");
    return "Unknown User";
  }
}
// Batch username loading to avoid multiple sequential requests
async function loadUserNames(userIds) {
  const uniqueIds = [...new Set(userIds)].filter(
    (id) => id && !userNameCache.has(id)
  );

  if (uniqueIds.length === 0) return;

  // Load user names in parallel
  const promises = uniqueIds.map(async (userId) => {
    try {
      const name = await getInstructorName(userId);
      userNameCache.set(userId, name);
    } catch (error) {
      userNameCache.set(userId, "Unknown User");
    }
  });

  await Promise.all(promises);
}

// Functions to handle opening and closing chats
function openChat() {
  chats.classList.add("open");
  chatView.classList.add("active");
}

function closeChat() {
  chats.classList.remove("open");
  chatView.classList.remove("active");
  document.querySelectorAll(".chat__item").forEach((chat) => {
    chat.classList.remove("active");
  });
}
// Fix 7: Ensure chat click handler properly sets up subscription
function attachChatClickListeners() {
  document.querySelectorAll(".chat__item").forEach((chatItem) => {
    const img = chatItem.querySelector("img");
    chatItem.addEventListener("click", async (e) => {
      // Close chat list and open chat view
      chatImgEl.src = img.src;
      if (
        e.target.closest(".chat__item") &&
        !e.target.closest(".chat__item").classList.contains("active")
      ) {
        document.querySelectorAll(".chat__item").forEach((item) => {
          item.classList.remove("active");
        });
        e.target.closest(".chat__item").classList.add("active");
        openChat();
      }

      const chatId = chatItem.getAttribute("data-chat-id");
      console.log(
        `Clicked on chat ID: ${chatId}, current chat ID: ${currentChatId}`
      );

      // Don't reload if we're already on this chat
      if (currentChatId === chatId) {
        return;
      }

      // Fix 8: Make sure we properly clean up previous subscription
      if (subscription) {
        console.log("Unsubscribing from previous chat subscription");
        try {
          subscription.unsubscribe();
        } catch (e) {
          console.warn("Error during unsubscribe:", e);
        }
        subscription = null;
      }

      currentChatId = chatId;
      const chatNameText = chatItem.getAttribute("data-chat-name");
      console.log(`Setting current chat to ${chatNameText} (ID: ${chatId})`);

      // Reset processed message IDs when changing chats
      processedMessageIds = new Set();

      // Show loading indicator
      const messagesContainer = document.querySelector(
        ".chat__messages-container"
      );
      messagesContainer.innerHTML =
        '<div class="loading-messages loader"></div>';

      // Load chat details and messages in parallel
      try {
        const [chatDetails, chatMessages, enrolledStudents] = await Promise.all(
          [
            getChatDetails(chatId),
            retrieveChatMessages(chatId),
            getEnrolledStudents(chatId), // Get students enrolled in this chat's course
          ]
        );

        // Render chat details
        renderChatDetails(chatDetails);

        // Extract all user IDs from messages and enrolled students
        const messageUserIds = chatMessages.map((msg) => msg.senderid);
        const allUserIds = [
          ...new Set([...messageUserIds, ...enrolledStudents, instructorId]),
        ];

        // Prefetch all user names in parallel before rendering messages
        await loadUserNames(allUserIds);

        // Only render if this is still the current chat
        if (currentChatId === chatId) {
          // Render chat messages
          renderChatMessages(chatMessages, true); // false = no animation on initial load
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        messagesContainer.innerHTML =
          '<div class="error-messages">Error loading messages. Please try again.</div>';
      }

      // Set up event listener for send button
      setupSendMessageHandler(chatId);

      // Fix 9: Make sure subscription is active for this chat
      console.log(`Setting up subscription for newly selected chat ${chatId}`);
      setupChatSubscription(chatId);
    });
  });

  // Add event listener to collapse button
  collapseButton.addEventListener("click", closeChat);
}

// Get students enrolled in a specific course related to the chat
async function getEnrolledStudents(chatId) {
  try {
    // First get the course_id related to this chat
    const { data: chatData, error: chatError } = await supaClient
      .from("chat")
      .select("chat_name")
      .eq("chat_id", chatId)
      .single();

    if (chatError) throw chatError;

    // Find the course with this name
    const { data: courseData, error: courseError } = await supaClient
      .from("course")
      .select("course_id")
      .eq("course_name", chatData.chat_name)
      .single();

    if (courseError) throw courseError;

    // Get students enrolled in this course
    const { data: enrollmentData, error: enrollmentError } = await supaClient
      .from("enrollment")
      .select("student_id")
      .eq("course_id", courseData.course_id);

    if (enrollmentError) throw enrollmentError;

    return enrollmentData.map((enrollment) => enrollment.student_id);
  } catch (error) {
    console.error("Error getting enrolled students:", error);
    return [];
  }
}

// Setup send message handler
function setupSendMessageHandler(chatId) {
  const sendButton = document.querySelector(".send__message-btn");
  const messageInput = document.querySelector(".message__input");

  // First, remove any existing event listeners by cloning the elements
  const newSendButton = sendButton.cloneNode(true);
  sendButton.parentNode.replaceChild(newSendButton, sendButton);

  const newMessageInput = messageInput.cloneNode(true);
  messageInput.parentNode.replaceChild(newMessageInput, messageInput);

  // Add event listener to the send button
  newSendButton.addEventListener("click", async () => {
    const messageContent = newMessageInput.value.trim();
    if (messageContent) {
      await sendMessage(chatId, messageContent);
      newMessageInput.value = ""; // Clear input after sending
      newMessageInput.focus(); // Keep focus on input for better UX
    }
  });

  // Add event listener for Enter key
  newMessageInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default to avoid form submission
      const messageContent = newMessageInput.value.trim();
      if (messageContent) {
        await sendMessage(chatId, messageContent);
        newMessageInput.value = ""; // Clear input after sending
      }
    }
  });

  // Focus the input field for immediate typing
  newMessageInput.focus();
}
// Fix 10: Add more debugging to the initial setup
function setupAllChatSubscriptions() {
  console.log(`Setting up ${userChats.length} chat subscriptions...`);

  // Clean up existing subscriptions properly
  Object.entries(chatSubscriptions).forEach(([chatId, sub]) => {
    if (sub && typeof sub.unsubscribe === "function") {
      try {
        console.log(`Cleaning up subscription for chat ${chatId}`);
        sub.unsubscribe();
      } catch (e) {
        console.warn(`Error unsubscribing from chat ${chatId}:`, e);
      }
    }
  });

  // Reset subscription objects
  chatSubscriptions = {};

  // Set up a subscription for each chat
  userChats.forEach((chatId) => {
    setupChatSubscription(chatId);
  });

  // Reset reconnection attempts on successful setup
  reconnectAttempts = 0;
  isConnected = true;
}
// Fix 1: Improved setupChatSubscription function with proper channel management
function setupChatSubscription(chatId) {
  // Skip if no valid chat ID
  if (!chatId) {
    console.error("Invalid chat ID for subscription");
    return;
  }

  console.log(`Setting up subscription for chat ${chatId}`);

  // Unsubscribe from any existing subscription for this chat
  try {
    if (chatSubscriptions[chatId]) {
      chatSubscriptions[chatId].unsubscribe();
      delete chatSubscriptions[chatId]; // Ensure reference is cleared
    }
  } catch (e) {
    console.warn(`Error unsubscribing from chat ${chatId}:`, e);
  }

  try {
    // Fix 2: Use a simpler channel name without timestamp to avoid duplicate channels
    const channelName = `chat:${chatId}`;
    const channel = supaClient.channel(channelName);

    // Fix 3: Add better debugging for subscription status
    console.log(`Creating channel ${channelName} for chat ${chatId}`);

    // Subscribe to changes
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message",
          filter: `chat_id=eq.${chatId}`,
        },
        handleNewMessage
      )
      .subscribe((status, err) => {
        console.log(`Subscription status for chat ${chatId}:`, status);

        if (err) {
          console.error(`Subscription error for chat ${chatId}:`, err);
        }

        if (status === "SUBSCRIBED") {
          console.log(`Successfully subscribed to chat ${chatId}`);
          isConnected = true;
          reconnectAttempts = 0;
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "CLOSED" ||
          status === "TIMED_OUT"
        ) {
          console.error(
            `Error with subscription for chat ${chatId}: ${status}`
          );
          isConnected = false;

          // Try to resubscribe after a delay if there was an error
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const delay = RECONNECT_INTERVAL * reconnectAttempts; // Increasing backoff
            console.log(
              `Attempt ${reconnectAttempts} to reconnect chat ${chatId} in ${delay}ms`
            );

            setTimeout(() => {
              if (currentChatId === chatId) {
                setupChatSubscription(chatId);
              }
            }, delay);
          } else {
            console.error(
              `Maximum reconnection attempts reached for chat ${chatId}`
            );

            // Final attempt with much longer delay
            setTimeout(() => {
              reconnectAttempts = 0;
              setupChatSubscription(chatId);
            }, RECONNECT_INTERVAL * 5);
          }
        }
      });

    // Store the subscription reference
    chatSubscriptions[chatId] = channel;

    // Fix 4: Make sure to update the current subscription reference
    if (chatId === currentChatId) {
      subscription = channel;
    }
  } catch (error) {
    console.error(`Error setting up subscription for chat ${chatId}:`, error);
  }
}
// Fix 5: Improved handler for new incoming messages with better debugging
// function handleNewMessage(payload) {
//   if (!payload || !payload.new || !payload.new.msg_id) {
//     console.error("Invalid message payload received:", payload);
//     return;
//   }

//   const message = payload.new;
//   const msgId = message.msg_id;

//   // Debug message to track subscription events
//   console.log(
//     `Received message event for chat ${message.chat_id}, message ID: ${msgId}`
//   );

//   // Skip if we've already processed this message
//   if (processedMessageIds.has(msgId)) {
//     console.log(`Skipping duplicate message ${msgId}`);
//     return;
//   }

//   console.log(`New message received in chat ${message.chat_id}:`, message);

//   // Mark as processed to prevent duplicates
//   processedMessageIds.add(msgId);

//   // Ensure the UI updates happen regardless of name fetching
//   processMessageUpdate(message);

//   // Also fetch the name if needed
//   if (!userNameCache.has(message.senderid)) {
//     safeGetUserName(message.senderid)
//       .then((senderName) => {
//         userNameCache.set(message.senderid, senderName);
//         // Refresh display of sender name in any messages from this sender
//         document
//           .querySelectorAll(`[data-sender-id="${message.senderid}"]`)
//           .forEach((msg) => {
//             const senderEl = msg.querySelector(".message__sender-name");
//             if (senderEl && message.senderid != instructorId)
//               senderEl.textContent = senderName;
//           });
//       })
//       .catch((err) => {
//         console.error("Error fetching sender name:", err);
//         userNameCache.set(message.senderid, "Unknown User");
//       });
//   }
// }
function handleNewMessage(payload) {
  if (!payload || !payload.new || !payload.new.msg_id) {
    console.error("Invalid message payload received:", payload);
    return;
  }

  const message = payload.new;
  const msgId = message.msg_id;

  // Debug message to track subscription events
  console.log(
    `Received message event for chat ${message.chat_id}, message ID: ${msgId}`
  );

  // Skip if we've already processed this message
  if (processedMessageIds.has(msgId)) {
    console.log(`Skipping duplicate message ${msgId}`);
    return;
  }

  console.log(`New message received in chat ${message.chat_id}:`, message);

  // Mark as processed to prevent duplicates
  processedMessageIds.add(msgId);

  // Always fetch the name for non-instructor senders to ensure we have student names
  if (
    Number(message.senderid) !== Number(instructorId) &&
    (!userNameCache.has(message.senderid) ||
      userNameCache.get(message.senderid) === "Unknown User")
  ) {
    // Try to get student name first, then instructor name as fallback
    safeGetUserName(message.senderid)
      .then((senderName) => {
        userNameCache.set(message.senderid, senderName);

        // Refresh display of sender name in any messages from this sender
        document
          .querySelectorAll(`[data-sender-id="${message.senderid}"]`)
          .forEach((msg) => {
            const senderEl = msg.querySelector(".message__sender-name");
            if (senderEl) {
              senderEl.textContent = senderName;
            }
          });
      })
      .catch((err) => {
        console.error("Error fetching sender name:", err);
        userNameCache.set(message.senderid, "Unknown User");
      });
  }

  // Process the message update regardless
  processMessageUpdate(message);
}
// Fix 6: Better detection of current chat
function processMessageUpdate(message) {
  try {
    console.log(
      `Processing message update for chat ${message.chat_id}, current chat: ${currentChatId}`
    );

    // If this is the current open chat, add message to chat view
    if (Number(currentChatId) === Number(message.chat_id)) {
      console.log("This is the active chat, adding message to view");
      addMessageToChat(message);
    } else {
      console.log("Message is for a different chat than the current one");
    }

    // Update the chat list item with this message regardless
    updateLastMessageInChatList(
      message.chat_id,
      message.msg_content,
      message.senderid
    );
  } catch (error) {
    console.error("Error processing message update:", error);
  }
}
// Create a single message element for the chat with improved name handling
// function createMessageElement(message, animate = true) {
//   // Create the new message element
//   const messageEl = document.createElement("div");
//   messageEl.setAttribute("data-message-id", message.msg_id);
//   messageEl.setAttribute(
//     "data-timestamp",
//     new Date(message.msg_date_time).getTime()
//   );
//   messageEl.setAttribute("data-sender-id", message.senderid);

//   const messageSenderName = document.createElement("p");
//   const messageContent = document.createElement("p");
//   const messageTime = document.createElement("p");

//   messageSenderName.classList.add("message__sender-name");
//   messageContent.classList.add("message__content");
//   messageTime.classList.add("message__time");

//   messageContent.textContent = message.msg_content || "";
//   messageTime.textContent = formatDateTime(new Date(message.msg_date_time));

//   // Check if the message is from the current instructor
//   const isSentByCurrentUser = Number(message.senderid) === Number(instructorId);

//   // Add message classes based on sender
//   if (isSentByCurrentUser) {
//     messageEl.classList.add("sent");
//     messageSenderName.textContent = "You";
//   } else {
//     messageEl.classList.add("received");
//     // Get sender name from cache or set a placeholder
//     const senderName = userNameCache.get(message.senderid);
//     messageSenderName.textContent = senderName || "Loading...";

//     // If name isn't in cache yet, fetch it asynchronously
//     if (!senderName) {
//       safeGetUserName(message.senderid).then((name) => {
//         // Update this message and any other pending messages from same sender
//         userNameCache.set(message.senderid, name);
//         document
//           .querySelectorAll(`[data-sender-id="${message.senderid}"]`)
//           .forEach((msg) => {
//             const senderEl = msg.querySelector(".message__sender-name");
//             if (senderEl) senderEl.textContent = name;
//           });
//       });
//     }
//   }

//   messageEl.classList.add("message");

//   messageEl.appendChild(messageSenderName);
//   messageEl.appendChild(messageContent);
//   messageEl.appendChild(messageTime);

//   // Add animation if needed
//   if (animate) {
//     messageEl.style.opacity = "0";
//     messageEl.style.transform = "translateY(10px)";

//     // Use requestAnimationFrame for smoother animations
//     requestAnimationFrame(() => {
//       messageEl.style.transition = "opacity 0.3s ease, transform 0.3s ease";
//       messageEl.style.opacity = "1";
//       messageEl.style.transform = "translateY(0)";
//     });
//   }

//   return messageEl;
// }
function createMessageElement(message, animate = true) {
  // Create the new message element
  const messageEl = document.createElement("div");
  messageEl.setAttribute("data-message-id", message.msg_id);
  messageEl.setAttribute(
    "data-timestamp",
    new Date(message.msg_date_time).getTime()
  );
  messageEl.setAttribute("data-sender-id", message.senderid);

  const messageSenderName = document.createElement("p");
  const messageContent = document.createElement("p");
  const messageTime = document.createElement("p");

  messageSenderName.classList.add("message__sender-name");
  messageContent.classList.add("message__content");
  messageTime.classList.add("message__time");

  messageContent.textContent = message.msg_content || "";
  messageTime.textContent = formatDateTime(new Date(message.msg_date_time));

  // Check if the message is from the current instructor
  const isSentByCurrentUser = Number(message.senderid) === Number(instructorId);

  // Add message classes based on sender
  if (isSentByCurrentUser) {
    messageEl.classList.add("sent");
    messageSenderName.textContent = "You";
  } else {
    messageEl.classList.add("received");
    // Get sender name from cache or set a placeholder
    const senderName = userNameCache.get(message.senderid);
    messageSenderName.textContent = senderName || "Loading...";

    // If name isn't in cache yet, fetch it asynchronously with priority on student names
    if (!senderName || senderName === "Unknown User") {
      getStudentName(message.senderid)
        .then((studentName) => {
          if (studentName) {
            userNameCache.set(message.senderid, studentName);
            messageSenderName.textContent = studentName;
          } else {
            // Fallback to instructor name if not a student
            getInstructorName(message.senderid)
              .then((instructorName) => {
                if (instructorName) {
                  userNameCache.set(message.senderid, instructorName);
                  messageSenderName.textContent = instructorName;
                } else {
                  userNameCache.set(message.senderid, "Unknown User");
                  messageSenderName.textContent = "Unknown User";
                }
              })
              .catch(() => {
                userNameCache.set(message.senderid, "Unknown User");
                messageSenderName.textContent = "Unknown User";
              });
          }
        })
        .catch(() => {
          safeGetUserName(message.senderid).then((name) => {
            messageSenderName.textContent = name;
          });
        });
    }
  }

  messageEl.classList.add("message");

  messageEl.appendChild(messageSenderName);
  messageEl.appendChild(messageContent);
  messageEl.appendChild(messageTime);

  // Add animation if needed
  if (animate) {
    messageEl.style.opacity = "0";
    messageEl.style.transform = "translateY(10px)";

    // Use requestAnimationFrame for smoother animations
    requestAnimationFrame(() => {
      messageEl.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      messageEl.style.opacity = "1";
      messageEl.style.transform = "translateY(0)";
    });
  }

  return messageEl;
}
// Better handling of adding messages to the chat view
async function addMessageToChat(message) {
  // First check if we already have this message in the DOM
  const existingMessage = document.querySelector(
    `[data-message-id="${message.msg_id}"]`
  );
  if (existingMessage) {
    return; // Skip if already exists
  }

  try {
    // Create the message element
    const messagesContainer = document.querySelector(
      ".chat__messages-container"
    );

    // Check if we have a container
    if (!messagesContainer) {
      console.error("Messages container not found");
      return;
    }

    // Remove empty message placeholder if exists
    const emptyPlaceholder = messagesContainer.querySelector(".empty-messages");
    if (emptyPlaceholder) {
      emptyPlaceholder.remove();
    }

    // Create and append the message element
    const messageEl = createMessageElement(message, true);
    messagesContainer.appendChild(messageEl);

    // Scroll to the bottom to show the new message
    scrollToBottom();
  } catch (error) {
    console.error("Error adding message to chat:", error);
  }
}
// Efficient scrolling method with requestAnimationFrame
function scrollToBottom() {
  requestAnimationFrame(() => {
    const messagesContainer = document.querySelector(
      ".chat__messages-container"
    );
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
}

// Format date/time for message timestamps
function formatDateTime(date) {
  // Adjust for local timezone and format
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  // Get just the time part for today's messages
  const today = new Date();
  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Show full date for older messages
  return date.toLocaleString("en-US", options);
}

// Render the chat list with instructor's courses
async function renderChatList() {
  try {
    chatListContainer.innerHTML = '<div class="loader loading-chats"></div>';
    const chats = await getInstructorChatList();

    // Store the chat IDs for subscription
    userChats = chats.map((chat) => chat.chat_id);

    if (chats.length === 0) {
      // Display a message when no chats are available
      chatListContainer.innerHTML = `
        <li class="no-chats">
          <p>No course chats available</p>
          <p>You are not teaching any courses yet</p>
        </li>
      `;
      return;
    }

    // Create a document fragment for batch DOM updates
    const fragment = document.createDocumentFragment();
    const pendingChats = [];

    // First render the basic chat list structure
    for (const chat of chats) {
      const chatItem = document.createElement("li");
      chatItem.className = "chat__item";
      chatItem.setAttribute("data-chat-id", chat.chat_id);
      chatItem.setAttribute("data-chat-name", chat.chat_name);
      chatItem.innerHTML = `
        <div class="chat__img">
          <img src="src/images/Courses/${chat.chat_name.toUpperCase()}.png" alt="${
        chat.chat_name
      }">
        </div>
        <div class="chat__details">
          <div class="chat__name">${chat.chat_name}</div>
          <div class="chat__last-message">Loading...</div>
        </div>
      `;

      fragment.appendChild(chatItem);
      pendingChats.push(chat.chat_id);
    }

    // Update the DOM once with all chat items
    chatListContainer.innerHTML = "";
    chatListContainer.appendChild(fragment);

    // Attach click listeners immediately
    attachChatClickListeners();

    // Set up subscriptions for all chats
    setupAllChatSubscriptions();
    // Then load last messages for each chat in parallel
    const lastMessagePromises = pendingChats.map(async (chatId) => {
      const lastMessage = await getLastMessage(chatId);
      if (lastMessage) {
        // Ensure we have the sender name
        if (
          lastMessage?.senderid &&
          !userNameCache.has(lastMessage?.senderid)
        ) {
          await safeGetUserName(lastMessage?.senderid);
        }
        return { chatId, lastMessage };
      }
      return { chatId, lastMessage: null };
    });

    // Update last messages as they come in
    const results = await Promise.all(lastMessagePromises);

    // Update the UI with last message data
    for (const { chatId, lastMessage } of results) {
      const chatItem = document.querySelector(
        `.chat__item[data-chat-id="${chatId}"]`
      );
      if (!chatItem) continue;

      const lastMessageEl = chatItem.querySelector(".chat__last-message");
      if (!lastMessageEl) continue;
      await updateChatLastMessageDisplay(lastMessageEl, lastMessage);
    }
  } catch (error) {
    console.error("Error rendering chat list:", error);
    chatListContainer.innerHTML = `
      <li class="error-message">
        <p>Error loading chats. Please try again.</p>
      </li>
    `;
  }
}

// Helper function to update last message display
// async function updateChatLastMessageDisplay(lastMessageEl, lastMessage) {
//   let messageText = "No messages yet...";
//   let senderPrefix = "";
//   if (!lastMessage) {
//     lastMessageEl.textContent = messageText;
//     return;
//   }
//   const studentName = await getStudentName(lastMessage.senderid);
//   if (studentName) {
//     userNameCache.set(lastMessage.senderid, studentName);
//   }
//   if (lastMessage) {
//     messageText = truncateText(lastMessage.msg_content, 30);
//     // Properly determine the sender prefix
//     if (+instructorId === +lastMessage.senderid) {
//       senderPrefix = "You: ";
//     } else if (
//       lastMessage.senderid &&
//       userNameCache.has(lastMessage.senderid)
//     ) {
//       senderPrefix = `${userNameCache.get(lastMessage.senderid)}: `;
//     }
//   }

//   lastMessageEl.textContent = senderPrefix + messageText;
// }
async function updateChatLastMessageDisplay(lastMessageEl, lastMessage) {
  let messageText = "No messages yet...";
  let senderPrefix = "";

  if (!lastMessage) {
    lastMessageEl.textContent = messageText;
    return;
  }

  // Try to get student name first for non-instructor messages
  if (
    lastMessage.senderid &&
    Number(lastMessage.senderid) !== Number(instructorId)
  ) {
    const studentName = await getStudentName(lastMessage.senderid);
    if (studentName) {
      userNameCache.set(lastMessage.senderid, studentName);
      senderPrefix = `${studentName}: `;
    } else {
      // Try instructor name as fallback
      const instructorName = await getInstructorName(lastMessage.senderid);
      if (instructorName) {
        userNameCache.set(lastMessage.senderid, instructorName);
        senderPrefix = `${instructorName}: `;
      } else {
        senderPrefix = "Unknown User: ";
        userNameCache.set(lastMessage.senderid, "Unknown User");
      }
    }
  } else if (Number(lastMessage.senderid) === Number(instructorId)) {
    senderPrefix = "You: ";
  }

  messageText = truncateText(lastMessage.msg_content, 30);
  lastMessageEl.textContent = senderPrefix + messageText;
}
// Truncate text to specified length
function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Get the last message for a chat
async function getLastMessage(chatId) {
  const { data, error } = await supaClient
    .from("message")
    .select("*")
    .eq("chat_id", chatId)
    .order("msg_date_time", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }
  return data[0];
}

// Get the list of chats for the instructor
async function getInstructorChatList() {
  try {
    // First get the courses this instructor is teaching
    const { data: instructorCourses, error: coursesError } = await supaClient
      .from("enrollment")
      .select("course_id")
      .eq("instructor_id", instructorId);
    if (coursesError) throw coursesError;
    if (!instructorCourses || instructorCourses.length === 0) return [];

    // Get the course names for these courses
    const { data: courses, error: courseNamesError } = await supaClient
      .from("course")
      .select("course_id, course_name")
      .in(
        "course_id",
        instructorCourses.map((course) => course.course_id)
      );
    console.log(courses);
    if (courseNamesError) throw courseNamesError;

    // Get the chat IDs for these course names
    const { data: chats, error: chatsError } = await supaClient
      .from("chat")
      .select("*")
      .in(
        "chat_name",
        courses.map((course) => course.course_name)
      );

    if (chatsError) throw chatsError;

    return chats || [];
  } catch (error) {
    console.error("Error fetching instructor chat list:", error);
    return [];
  }
}

// Get details for a specific chat
async function getChatDetails(chatId) {
  const { data, error } = await supaClient
    .from("chat")
    .select("*")
    .eq("chat_id", chatId)
    .single();

  if (error) {
    console.error("Error fetching chat details:", error);
    return null;
  } else {
    return data;
  }
}

// Render chat details in UI
function renderChatDetails(chat) {
  if (chat) {
    chatName.textContent = chat.chat_name;
  }
}

// Retrieve messages for a specific chat
async function retrieveChatMessages(chatId) {
  const { data, error } = await supaClient
    .from("message")
    .select("*")
    .eq("chat_id", chatId)
    .order("msg_date_time", { ascending: true }) // Primary sort by timestamp
    .order("msg_id", { ascending: true }); // Secondary sort by message_id for consistency

  if (error) {
    console.error("Error fetching chat messages:", error);
    return [];
  } else {
    // Build our processed message IDs set
    data.forEach((msg) => {
      if (msg.msg_id) {
        processedMessageIds.add(msg.msg_id);
      }
    });

    return data;
  }
}

// Render chat messages in the UI
function renderChatMessages(messages, animate = true) {
  // Get the messages container
  const messagesContainer = document.querySelector(".chat__messages-container");

  // Clear existing messages
  messagesContainer.innerHTML = "";

  if (!messages || messages.length === 0) {
    // Show a message when there are no messages
    const emptyMessage = document.createElement("div");
    emptyMessage.classList.add("empty-messages");
    emptyMessage.textContent = "No messages yet. Start the conversation!";
    messagesContainer.appendChild(emptyMessage);
    return;
  }

  // Modified: Ensure messages are properly sorted by timestamp (oldest to newest)
  messages.sort((a, b) => {
    const timeA = new Date(a.msg_date_time).getTime();
    const timeB = new Date(b.msg_date_time).getTime();

    // If timestamps are equal, sort by message_id as secondary criteria
    if (timeA === timeB) {
      return a.msg_id - b.msg_id;
    }

    return timeA - timeB;
  });

  // Performance optimization: Create a document fragment and batch render
  const fragment = document.createDocumentFragment();

  // For large message sets, use virtual rendering
  const shouldVirtualize = messages.length > 100;

  // If virtualizing, only render the last 50 messages initially
  const messagesToRender = shouldVirtualize ? messages.slice(-50) : messages;

  // Render messages in batches using requestAnimationFrame for better performance
  const renderBatch = (startIdx, endIdx) => {
    for (let i = startIdx; i < endIdx && i < messagesToRender.length; i++) {
      const message = messagesToRender[i];
      if (!message) continue;

      const messageEl = createMessageElement(message, false); // Don't animate batches
      fragment.appendChild(messageEl);
    }

    // Add this batch to the container
    messagesContainer.appendChild(fragment);
  };

  // For small message sets, render all at once
  if (!shouldVirtualize) {
    renderBatch(0, messagesToRender.length);
  } else {
    // For large message sets, render in chunks
    const BATCH_SIZE = 20;
    const totalBatches = Math.ceil(messagesToRender.length / BATCH_SIZE);

    let batchIndex = 0;

    const processBatch = () => {
      if (batchIndex >= totalBatches) {
        // All batches processed - scroll to bottom when done
        scrollToBottom();
        return;
      }

      const startIdx = batchIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, messagesToRender.length);

      renderBatch(startIdx, endIdx);
      batchIndex++;

      // Process next batch on next animation frame
      requestAnimationFrame(processBatch);
    };

    // Start batch processing
    processBatch();
  }

  // Scroll to bottom when all messages are rendered
  scrollToBottom();
}
// Improved function to update the last message in chat list
// async function updateLastMessageInChatList(chatId, messageContent, senderId) {
//   const chatItem = document.querySelector(
//     `.chat__item[data-chat-id="${chatId}"]`
//   );

//   if (!chatItem) return;

//   const lastMessageEl = chatItem.querySelector(".chat__last-message");
//   if (!lastMessageEl) return;

//   try {
//     // Determine sender prefix based on sender ID
//     let senderPrefix = "";

//     // Handle current user case first (most efficient)
//     if (Number(senderId) === Number(instructorId)) {
//       senderPrefix = "You: ";
//     }
//     // Check cache for other users
//     else if (userNameCache.has(senderId)) {
//       senderPrefix = `${userNameCache.get(senderId)}: `;
//     }
//     // Fetch name if not in cache
//     else {
//       const senderName = await safeGetUserName(senderId);
//       userNameCache.set(senderId, senderName);
//       senderPrefix = `${senderName}: `;
//     }

//     // Update the message preview
//     const truncatedMessage = truncateText(messageContent, 30);
//     lastMessageEl.textContent = senderPrefix + truncatedMessage;

//     // Move this chat to the top of the list for better UX
//     const parent = chatItem.parentNode;
//     if (parent && parent.firstChild !== chatItem) {
//       parent.insertBefore(chatItem, parent.firstChild);
//     }
//   } catch (error) {
//     console.error("Error updating last message in chat list:", error);
//     // Fallback display if there's an error
//     const truncatedMessage = truncateText(messageContent, 30);
//     lastMessageEl.textContent = truncatedMessage;
//   }
// }
async function updateLastMessageInChatList(chatId, messageContent, senderId) {
  const chatItem = document.querySelector(
    `.chat__item[data-chat-id="${chatId}"]`
  );

  if (!chatItem) return;

  const lastMessageEl = chatItem.querySelector(".chat__last-message");
  if (!lastMessageEl) return;

  try {
    // Determine sender prefix based on sender ID
    let senderPrefix = "";

    // Handle current user case first (most efficient)
    if (Number(senderId) === Number(instructorId)) {
      senderPrefix = "You: ";
    }
    // Check cache for other users
    else if (userNameCache.has(senderId)) {
      senderPrefix = `${userNameCache.get(senderId)}: `;
    }
    // Fetch name if not in cache - prioritize student names
    else {
      const studentName = await getStudentName(senderId);
      if (studentName) {
        userNameCache.set(senderId, studentName);
        senderPrefix = `${studentName}: `;
      } else {
        const instructorName = await getInstructorName(senderId);
        userNameCache.set(senderId, instructorName || "Unknown User");
        senderPrefix = `${instructorName || "Unknown User"}: `;
      }
    }

    // Update the message preview
    const truncatedMessage = truncateText(messageContent, 30);
    lastMessageEl.textContent = senderPrefix + truncatedMessage;

    // Move this chat to the top of the list for better UX
    const parent = chatItem.parentNode;
    if (parent && parent.firstChild !== chatItem) {
      parent.insertBefore(chatItem, parent.firstChild);
    }
  } catch (error) {
    console.error("Error updating last message in chat list:", error);
    // Fallback display if there's an error
    const truncatedMessage = truncateText(messageContent, 30);
    lastMessageEl.textContent = truncatedMessage;
  }
}
// Improved sendMessage function with better name handling
async function sendMessage(chatId, messageContent) {
  try {
    const timestamp = new Date();

    // Create a temporary visual placeholder for the message with a unique ID
    const tempMessageId = `temp-${Date.now()}`;
    const messagesContainer = document.querySelector(
      ".chat__messages-container"
    );

    // Remove any "empty messages" placeholder if it exists
    const emptyPlaceholder = messagesContainer.querySelector(".empty-messages");
    if (emptyPlaceholder) {
      emptyPlaceholder.remove();
    }

    // Create temporary message element
    const messageEl = document.createElement("div");
    messageEl.id = tempMessageId;
    messageEl.classList.add("message", "sent", "pending");
    // Add timestamp as data attribute for sorting
    messageEl.setAttribute("data-timestamp", timestamp.getTime());
    messageEl.setAttribute("data-sender-id", instructorId);

    const messageSenderName = document.createElement("p");
    messageSenderName.classList.add("message__sender-name");
    messageSenderName.textContent = "You"; // Always "You" for current user

    const messageContent_el = document.createElement("p");
    messageContent_el.classList.add("message__content");
    messageContent_el.textContent = messageContent;

    const messageTime = document.createElement("p");
    messageTime.classList.add("message__time");
    messageTime.textContent = formatDateTime(timestamp);

    messageEl.appendChild(messageSenderName);
    messageEl.appendChild(messageContent_el);
    messageEl.appendChild(messageTime);

    // Append message to the end for chronological order
    messagesContainer.appendChild(messageEl);

    // Add animation for a smoother appearance
    messageEl.style.opacity = "0";
    messageEl.style.transform = "translateY(10px)";

    // Use requestAnimationFrame for smoother animations
    requestAnimationFrame(() => {
      messageEl.style.transition = "opacity 0.2s ease, transform 0.2s ease";
      messageEl.style.opacity = "1";
      messageEl.style.transform = "translateY(0)";

      // Scroll to bottom to show the new message
      scrollToBottom();
    });

    // Send the actual message to the database
    const { data, error } = await supaClient
      .from("message")
      .insert({
        chat_id: chatId,
        msg_content: messageContent,
        senderid: instructorId,
        msg_date_time: timestamp.toISOString(),
      })
      .select();

    if (error) {
      console.error("Error sending message:", error);
      messageEl.classList.add("error");
      messageTime.textContent = "Failed to send";

      // Add retry button
      const retryButton = document.createElement("button");
      retryButton.classList.add("retry-button");
      retryButton.textContent = "Retry";
      retryButton.addEventListener("click", () => {
        // Remove the failed message
        messageEl.remove();
        // Try sending again
        sendMessage(chatId, messageContent);
      });
      messageEl.appendChild(retryButton);
    } else {
      console.log("Message sent:", data);

      // Instead of removing the placeholder, just mark it as confirmed and add the ID
      messageEl.classList.remove("pending");
      messageEl.classList.add("confirmed");

      if (data && data[0] && data[0].msg_id) {
        messageEl.setAttribute("data-message-id", data[0].msg_id);

        // Add this message ID to our processed set to prevent duplication
        processedMessageIds.add(data[0].msg_id);
      }

      // Update the chat list manually in case the subscription is slow
      await updateLastMessageInChatList(chatId, messageContent, instructorId);
    }
  } catch (err) {
    console.error("Exception sending message:", err);
  }
}

// Fix 11: Initialize chat with explicit debugging
export function initInstructorChat() {
  console.log("Initializing instructor chat...");

  // Initial setup when page loads
  renderChatList();

  // Set up auto-reconnect for chat subscriptions
  window.addEventListener("online", () => {
    console.log("Network connection restored, reconnecting chat subscriptions");
    setupAllChatSubscriptions();
  });

  // Cleanup subscriptions when page is unloaded
  window.addEventListener("beforeunload", () => {
    console.log("Page unloading, cleaning up subscriptions");
    Object.values(chatSubscriptions).forEach((sub) => {
      if (sub) sub.unsubscribe();
    });
  });

  // Handle window resize for mobile view
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      // If returning to desktop size, make sure chat view is visible if a chat is selected
      if (document.querySelector(".chat__item.active")) {
        openChat();
      }
    }
  });

  // Add help text for empty state
  if (chatListContainer.children.length === 0) {
    const helpText = document.createElement("div");
    helpText.className = "help-text";
    helpText.innerHTML = `
      <p>Welcome to the chat system!</p>
      <p>Your course chats will appear here once you're assigned to teach courses.</p>
    `;
    chatListContainer.appendChild(helpText);
  }

  console.log("Instructor chat initialization complete");
}

// async function getStudentName(studentId) {
//   const { data, error } = await supaClient
//     .from("student")
//     .select("student_name")
//     .eq("student_id", studentId);
//   if (error) {
//     console.error("Error fetching student name:", error);
//     return null;
//   }
//   if (data && data.length > 0) {
//     return data[0].student_name;
//   }
// }
async function getStudentName(studentId) {
  try {
    const { data, error } = await supaClient
      .from("student")
      .select("student_name")
      .eq("student_id", studentId)
      .single();

    if (error) throw error;
    return data?.student_name || null;
  } catch (error) {
    console.error(`Error fetching student name for ID ${studentId}:`, error);
    return null;
  }
}
// Add this at the very end of your file (after the getStudentName function)

// Initialize the chat system when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded, initializing chat system...");
  initInstructorChat();
});

// Alternatively, if the script is loaded at the end of the body, you can call it directly:
// Call initInstructorChat function right away if script is at bottom of page
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  console.log("Document already ready, initializing chat immediately");
  setTimeout(initInstructorChat, 1); // Small timeout to ensure execution after current JS completes
} else {
  document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded, initializing chat system...");
    initInstructorChat();
  });
}
