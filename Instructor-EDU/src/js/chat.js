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

// // Helper function to safely get user names with caching
// async function safeGetUserName(userId) {
//   if (!userId) {
//     return "Unknown User";
//   }

//   // Check cache first
//   if (userNameCache.has(userId)) {
//     return userNameCache.get(userId);
//   }

//   try {
//     const name = await getInstructorName(userId);
//     userNameCache.set(userId, name); // Cache the result
//     return name;
//   } catch (error) {
//     console.error(`Error getting username for ID ${userId}:`, error);
//     userNameCache.set(userId, "Unknown User"); // Cache the fallback
//     return "Unknown User";
//   }
// }
// Helper function to safely get user names with caching
// async function safeGetUserName(userId) {
//   if (!userId) {
//     return "Unknown User";
//   }

//   // Check cache first
//   if (userNameCache.has(userId)) {
//     return userNameCache.get(userId);
//   }

//   try {
//     // Try getting instructor name first
//     const instructorName = await getInstructorName(userId);
//     if (instructorName) {
//       userNameCache.set(userId, instructorName);
//       return instructorName;
//     }

//     // If not instructor, try getting student name
//     const studentName = await getStudentName(userId);
//     if (studentName) {
//       userNameCache.set(userId, studentName);
//       return studentName;
//     }

//     // If no name found in either table
//     userNameCache.set(userId, "Unknown User");
//     return "Unknown User";
//   } catch (error) {
//     console.error(`Error getting username for ID ${userId}:`, error);
//     userNameCache.set(userId, "Unknown User"); // Cache the fallback
//     return "Unknown User";
//   }
// }
// Improved safeGetUserName function that better handles both student and instructor names
async function safeGetUserName(userId) {
  if (!userId) {
    return "Unknown User";
  }

  // Check cache first for performance
  if (userNameCache.has(userId)) {
    return userNameCache.get(userId);
  }

  try {
    // Try to get instructor name first
    let name = null;

    // If current user, just label as "You"
    if (Number(userId) === Number(instructorId)) {
      name = "You";
    } else {
      // Try instructor table first
      try {
        name = await getInstructorName(userId);
      } catch (e) {
        console.log(
          `User ${userId} not found in instructor table, trying student table`
        );
      }

      // If not an instructor, try student table
      if (!name) {
        try {
          const studentData = await getStudentName(userId);
          if (studentData) {
            name = studentData;
          }
        } catch (e) {
          console.log(`User ${userId} not found in student table either`);
        }
      }
    }

    // Use the name we found or default
    const finalName = name || "Unknown User";
    userNameCache.set(userId, finalName);
    return finalName;
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

// Attach click listeners to chat items
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

      // Don't reload if we're already on this chat
      if (currentChatId === chatId) {
        return;
      }

      // Unsubscribe from previous chat subscription if exists
      if (subscription) {
        subscription.unsubscribe();
      }

      currentChatId = chatId;
      const chatNameText = chatItem.getAttribute("data-chat-name");

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
          renderChatMessages(chatMessages, false); // false = no animation on initial load
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        messagesContainer.innerHTML =
          '<div class="error-messages">Error loading messages. Please try again.</div>';
      }

      // Set up event listener for send button
      setupSendMessageHandler(chatId);

      // Make sure subscription is active for this chat
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

// // Set up subscriptions for all instructor's chats
// function setupAllChatSubscriptions() {
//   // Clean up existing subscriptions
//   Object.values(chatSubscriptions).forEach((sub) => {
//     if (sub) sub.unsubscribe();
//   });

//   // Reset subscription objects
//   Object.keys(chatSubscriptions).forEach((key) => {
//     delete chatSubscriptions[key];
//   });

//   // Set up a subscription for each chat
//   userChats.forEach((chatId) => {
//     setupChatSubscription(chatId);
//   });

//   // Reset reconnection attempts on successful setup
//   reconnectAttempts = 0;
// }
// Setup all chat subscriptions with proper cleanup
function setupAllChatSubscriptions() {
  console.log("Setting up all chat subscriptions...");

  // Clean up existing subscriptions properly
  Object.values(chatSubscriptions).forEach((sub) => {
    if (sub && typeof sub.unsubscribe === "function") {
      try {
        sub.unsubscribe();
      } catch (e) {
        console.warn("Error unsubscribing:", e);
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
// // Setup chat subscription for real-time updates
// function setupChatSubscription(chatId) {
//   // Unsubscribe from any existing subscription for this chat
//   if (chatSubscriptions[chatId]) {
//     chatSubscriptions[chatId].unsubscribe();
//     delete chatSubscriptions[chatId];
//   }

//   // Create a more robust subscription with better error handling
//   try {
//     // Create a new channel for this chat
//     const channel = supaClient.channel(`chat:${chatId}`);
//     // Subscribe to changes
//     channel
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "message",
//           filter: `chat_id=eq.${chatId}`,
//         },
//         handleNewMessage
//       )
//       .subscribe((status) => {
//         console.log(`Subscription status for chat ${chatId}:`, status);

//         if (status === "SUBSCRIBED") {
//           console.log(`Successfully subscribed to chat ${chatId}`);
//           isConnected = true;
//           reconnectAttempts = 0;
//         } else if (
//           status === "CHANNEL_ERROR" ||
//           status === "CLOSED" ||
//           status === "TIMED_OUT"
//         ) {
//           console.error(
//             `Error with subscription for chat ${chatId}: ${status}`
//           );
//           isConnected = false;

//           // Try to resubscribe after a delay if there was an error
//           if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
//             reconnectAttempts++;
//             console.log(
//               `Attempt ${reconnectAttempts} to reconnect chat ${chatId} in ${RECONNECT_INTERVAL}ms`
//             );

//             setTimeout(() => {
//               if (!isConnected) {
//                 setupChatSubscription(chatId);
//               }
//             }, RECONNECT_INTERVAL);
//           } else {
//             console.error(
//               `Maximum reconnection attempts reached for chat ${chatId}`
//             );
//           }
//         }
//       });

//     // Store the subscription reference
//     chatSubscriptions[chatId] = channel;

//     // Update the current chat subscription reference
//     if (chatId === currentChatId) {
//       subscription = channel;
//     }
//   } catch (error) {
//     console.error(`Error setting up subscription for chat ${chatId}:`, error);

//     // Try to resubscribe after a delay
//     if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
//       reconnectAttempts++;
//       setTimeout(() => {
//         if (!isConnected) {
//           setupChatSubscription(chatId);
//         }
//       }, RECONNECT_INTERVAL);
//     }
//   }
// }
// Setup chat subscription for real-time updates
// function setupChatSubscription(chatId) {
//   // Unsubscribe from any existing subscription for this chat
//   if (chatSubscriptions[chatId]) {
//     chatSubscriptions[chatId].unsubscribe();
//     delete chatSubscriptions[chatId];
//   }

//   // Create a more robust subscription with better error handling
//   try {
//     // Create a new channel for this chat
//     const channel = supaClient.channel(`chat:${chatId}`);
//     // Subscribe to changes
//     channel
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "message",
//           filter: `chat_id=eq.${chatId}`,
//         },
//         handleNewMessage
//       )
//       .subscribe((status) => {
//         console.log(`Subscription status for chat ${chatId}:`, status);

//         if (status === "SUBSCRIBED") {
//           console.log(`Successfully subscribed to chat ${chatId}`);
//           isConnected = true;
//           reconnectAttempts = 0;
//         } else if (
//           status === "CHANNEL_ERROR" ||
//           status === "CLOSED" ||
//           status === "TIMED_OUT"
//         ) {
//           console.error(
//             `Error with subscription for chat ${chatId}: ${status}`
//           );
//           isConnected = false;

//           // Try to resubscribe after a delay if there was an error
//           if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
//             reconnectAttempts++;
//             console.log(
//               `Attempt ${reconnectAttempts} to reconnect chat ${chatId} in ${RECONNECT_INTERVAL}ms`
//             );

//             setTimeout(() => {
//               if (!isConnected) {
//                 setupChatSubscription(chatId);
//               }
//             }, RECONNECT_INTERVAL);
//           } else {
//             console.error(
//               `Maximum reconnection attempts reached for chat ${chatId}`
//             );

//             // Reset and try again after a longer delay
//             setTimeout(() => {
//               reconnectAttempts = 0;
//               setupChatSubscription(chatId);
//             }, RECONNECT_INTERVAL * 3);
//           }
//         }
//       });

//     // Store the subscription reference
//     chatSubscriptions[chatId] = channel;

//     // Update the current chat subscription reference
//     if (chatId === currentChatId) {
//       subscription = channel;
//     }
//   } catch (error) {
//     console.error(`Error setting up subscription for chat ${chatId}:`, error);

//     // Try to resubscribe after a delay
//     if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
//       reconnectAttempts++;
//       setTimeout(() => {
//         setupChatSubscription(chatId);
//       }, RECONNECT_INTERVAL);
//     }
//   }
// }

// Setup chat subscription for real-time updates with better error handling
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
    }
  } catch (e) {
    console.warn(`Error unsubscribing from chat ${chatId}:`, e);
  }

  // Delete old reference
  delete chatSubscriptions[chatId];

  // Create a more robust subscription with better error handling
  try {
    // Create a new channel for this chat with a unique channel name
    const channelName = `chat:${chatId}:${Date.now()}`;
    const channel = supaClient.channel(channelName);

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

    // Update the current chat subscription reference if this is the active chat
    if (chatId === currentChatId) {
      subscription = channel;
    }
  } catch (error) {
    console.error(`Error setting up subscription for chat ${chatId}:`, error);

    // Try to resubscribe after a delay
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      const delay = RECONNECT_INTERVAL * reconnectAttempts;
      setTimeout(() => {
        setupChatSubscription(chatId);
      }, delay);
    }
  }
}
// Handle new incoming messages
// function handleNewMessage(payload) {
//   if (!payload || !payload.new || !payload.new.msg_id) {
//     console.error("Invalid message payload received:", payload);
//     return;
//   }

//   const message = payload.new;

//   // Skip if we've already processed this message
//   if (processedMessageIds.has(message.msg_id)) {
//     console.log(`Skipping duplicate message ${message.msg_id}`);
//     return;
//   }
//   // Mark as processed to prevent duplicates
//   processedMessageIds.add(message.msg_id);
//   // Pre-load sender name if needed before processing the message
//   if (message.senderid && !userNameCache.has(message.senderid)) {
//     safeGetUserName(message.senderid).then(() => {
//       processMessageUpdate(message);
//     });
//   } else {
//     // Process immediately if sender info is available
//     processMessageUpdate(message);
//   }
// }
// function handleNewMessage(payload) {
//   if (!payload || !payload.new || !payload.new.msg_id) {
//     console.error("Invalid message payload received:", payload);
//     return;
//   }

//   const message = payload.new;

//   // Skip if we've already processed this message
//   if (processedMessageIds.has(message.msg_id)) {
//     console.log(`Skipping duplicate message ${message.msg_id}`);
//     return;
//   }

//   // Mark as processed to prevent duplicates
//   processedMessageIds.add(message.msg_id);

//   console.log(`New message received in chat ${message.chat_id}:`, message);

//   // Pre-load sender name if needed before processing the message
//   if (message.senderid && !userNameCache.has(message.senderid)) {
//     safeGetUserName(message.senderid).then(() => {
//       processMessageUpdate(message);
//     });
//   } else {
//     // Process immediately if sender info is available
//     processMessageUpdate(message);
//   }
// }
// Function to handle new incoming messages
// function handleNewMessage(payload) {
//   if (!payload || !payload.new || !payload.new.msg_id) {
//     console.error("Invalid message payload received:", payload);
//     return;
//   }

//   const message = payload.new;

//   // Skip if we've already processed this message
//   if (processedMessageIds.has(message.msg_id)) {
//     console.log(`Skipping duplicate message ${message.msg_id}`);
//     return;
//   }

//   // Mark as processed to prevent duplicates
//   processedMessageIds.add(message.msg_id);

//   console.log(`New message received in chat ${message.chat_id}:`, message);

//   // Always fetch sender name before processing the message to ensure it's available
//   safeGetUserName(message.senderid).then(() => {
//     processMessageUpdate(message);
//   });
// }
// Handle new incoming messages with proper deduplication
function handleNewMessage(payload) {
  if (!payload || !payload.new || !payload.new.msg_id) {
    console.error("Invalid message payload received:", payload);
    return;
  }

  const message = payload.new;
  const msgId = message.msg_id;

  // Skip if we've already processed this message
  if (processedMessageIds.has(msgId)) {
    console.log(`Skipping duplicate message ${msgId}`);
    return;
  }

  console.log(`New message received in chat ${message.chat_id}:`, message);

  // Mark as processed to prevent duplicates
  processedMessageIds.add(msgId);

  // Always fetch the sender name first to ensure it's available
  safeGetUserName(message.senderid)
    .then((senderName) => {
      // Ensure the sender name is in cache
      if (!userNameCache.has(message.senderid)) {
        userNameCache.set(message.senderid, senderName);
      }

      // Now process the message
      processMessageUpdate(message);
    })
    .catch((err) => {
      console.error("Error fetching sender name:", err);
      // Still process the message even if we couldn't get the name
      processMessageUpdate(message);
    });
}
// Process message updates in UI
// function processMessageUpdate(message) {
//   // If this is the current open chat, add message to chat view
//   if (currentChatId === message.chat_id) {
//     addMessageToChat(message);
//   }

//   // Update the chat list item with this message regardless
//   updateLastMessageInChatList(
//     message.chat_id,
//     message.msg_content,
//     message.senderid
//   );
// }
// Process message updates in UI with better error handling
function processMessageUpdate(message) {
  try {
    // If this is the current open chat, add message to chat view
    if (currentChatId === message.chat_id) {
      addMessageToChat(message);
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
// // Create a single message element for the chat
// function createMessageElement(message, animate = true) {
//   // Create the new message element
//   const messageEl = document.createElement("div");
//   messageEl.setAttribute("data-message-id", message.msg_id);
//   messageEl.setAttribute(
//     "data-timestamp",
//     new Date(message.msg_date_time).getTime()
//   );

//   const messageSenderName = document.createElement("p");
//   const messageContent = document.createElement("p");
//   const messageTime = document.createElement("p");

//   messageSenderName.classList.add("message__sender-name");
//   messageContent.classList.add("message__content");
//   messageTime.classList.add("message__time");

//   messageContent.textContent = message.msg_content || "";
//   messageTime.textContent = formatDateTime(new Date(message.msg_date_time));

//   // Check if the message is from the current instructor
//   const isSentByCurrentUser = message.senderid === +instructorId;

//   // Add message classes based on sender
//   if (isSentByCurrentUser) {
//     messageEl.classList.add("sent");
//     messageSenderName.textContent = userNameCache.get(instructorId) || "You";
//   } else {
//     messageEl.classList.add("received");
//     messageSenderName.textContent =
//       userNameCache.get(message.senderid) || "User";
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
// Create a single message element for the chat
function createMessageElement(message, animate = true) {
  // Create the new message element
  const messageEl = document.createElement("div");
  messageEl.setAttribute("data-message-id", message.msg_id);
  messageEl.setAttribute(
    "data-timestamp",
    new Date(message.msg_date_time).getTime()
  );

  const messageSenderName = document.createElement("p");
  const messageContent = document.createElement("p");
  const messageTime = document.createElement("p");

  messageSenderName.classList.add("message__sender-name");
  messageContent.classList.add("message__content");
  messageTime.classList.add("message__time");

  messageContent.textContent = message.msg_content || "";
  messageTime.textContent = formatDateTime(new Date(message.msg_date_time));

  // Check if the message is from the current instructor
  const isSentByCurrentUser = message.senderid === +instructorId;

  // Add message classes based on sender
  if (isSentByCurrentUser) {
    messageEl.classList.add("sent");
    messageSenderName.textContent = userNameCache.get(instructorId) || "You";
  } else {
    messageEl.classList.add("received");
    const senderName = userNameCache.get(message.senderid);
    messageSenderName.textContent = senderName || "User";

    // If we don't have the name yet, set a data attribute to update it later
    if (!senderName) {
      messageEl.setAttribute("data-sender-id", message.senderid);
      safeGetUserName(message.senderid).then((name) => {
        const pendingMessages = document.querySelectorAll(
          `[data-sender-id="${message.senderid}"]`
        );
        pendingMessages.forEach((msg) => {
          const senderEl = msg.querySelector(".message__sender-name");
          if (senderEl) senderEl.textContent = name;
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
// Add a message to the current chat view
// async function addMessageToChat(message) {
//   // First check if we already have this message in the DOM
//   const existingMessage = document.querySelector(
//     `[data-message-id="${message.msg_id}"]`
//   );
//   if (existingMessage) {
//     return; // Skip if already exists
//   }

//   // Create the message element
//   const messagesContainer = document.querySelector(".chat__messages-container");

//   // Check if we have a container
//   if (!messagesContainer) {
//     console.error("Messages container not found");
//     return;
//   }

//   const messageEl = createMessageElement(message, true);

//   // Always append the message at the end (chronological order)
//   messagesContainer.appendChild(messageEl);

//   // Scroll to the bottom to show the new message
//   scrollToBottom();
// }
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

    // Get sender name if not in cache yet
    if (message.senderid && !userNameCache.has(message.senderid)) {
      await safeGetUserName(message.senderid);
    }

    const messageEl = createMessageElement(message, true);

    // Always append the message at the end (chronological order)
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
async function updateChatLastMessageDisplay(lastMessageEl, lastMessage) {
  let messageText = "No messages yet...";
  let senderPrefix = "";
  if (!lastMessage) {
    lastMessageEl.textContent = messageText;
    return;
  }
  const studentName = await getStudentName(lastMessage.senderid);
  if (studentName) {
    userNameCache.set(lastMessage.senderid, studentName);
  }
  if (lastMessage) {
    messageText = truncateText(lastMessage.msg_content, 30);
    // Properly determine the sender prefix
    if (+instructorId === +lastMessage.senderid) {
      senderPrefix = "You: ";
    } else if (
      lastMessage.senderid &&
      userNameCache.has(lastMessage.senderid)
    ) {
      senderPrefix = `${userNameCache.get(lastMessage.senderid)}: `;
    }
  }

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

// // Update the last message in chat list when new message arrives
// async function updateLastMessageInChatList(chatId, messageContent, senderId) {
//   const chatItem = document.querySelector(
//     `.chat__item[data-chat-id="${chatId}"]`
//   );
//   console.log(chatItem);
//   if (!chatItem) return;

//   const lastMessageEl = chatItem.querySelector(".chat__last-message");
//   if (!lastMessageEl) return;
//   const studentName = await safeGetUserName(senderId);
//   let senderPrefix = "";
//   if (studentName) {
//     senderPrefix = `${studentName}: `;
//   }
//   // Set sender prefix
//   if (+instructorId === +senderId) {
//     senderPrefix = "You: ";
//   } else if (senderId && userNameCache.has(senderId)) {
//     senderPrefix = `${userNameCache.get(senderId)}: `;
//   } else if (senderId) {
//     // Load the name if not in cache
//     const senderName = await safeGetUserName(senderId);
//     senderPrefix = `${senderName}: `;
//   }

//   // Update the message preview
//   const truncatedMessage = truncateText(messageContent, 30);
//   lastMessageEl.textContent = senderPrefix + truncatedMessage;

//   // Move this chat to the top of the list for better UX
//   const parent = chatItem.parentNode;
//   if (parent && parent.firstChild !== chatItem) {
//     parent.insertBefore(chatItem, parent.firstChild);
//   }
// }
// Update the last message in chat list when new message arrives
async function updateLastMessageInChatList(chatId, messageContent, senderId) {
  const chatItem = document.querySelector(
    `.chat__item[data-chat-id="${chatId}"]`
  );

  if (!chatItem) return;

  const lastMessageEl = chatItem.querySelector(".chat__last-message");
  if (!lastMessageEl) return;

  // Always ensure sender name is available before updating
  const senderName = await safeGetUserName(senderId);
  let senderPrefix = "";

  // Set sender prefix
  if (+instructorId === +senderId) {
    senderPrefix = "You: ";
  } else if (senderName) {
    senderPrefix = `${senderName}: `;
  }

  // Update the message preview
  const truncatedMessage = truncateText(messageContent, 30);
  lastMessageEl.textContent = senderPrefix + truncatedMessage;

  // Move this chat to the top of the list for better UX
  const parent = chatItem.parentNode;
  if (parent && parent.firstChild !== chatItem) {
    parent.insertBefore(chatItem, parent.firstChild);
  }
}
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

    // If we don't have the current user's name yet, get it
    if (!userNameCache.has(instructorId)) {
      await safeGetUserName(instructorId);
    }

    // Create temporary message element
    const messageEl = document.createElement("div");
    messageEl.id = tempMessageId;
    messageEl.classList.add("message", "sent", "pending");
    // Add timestamp as data attribute for sorting
    messageEl.setAttribute("data-timestamp", timestamp.getTime());

    const messageSenderName = document.createElement("p");
    messageSenderName.classList.add("message__sender-name");
    messageSenderName.textContent = userNameCache.get(instructorId) || "You";

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

// Export a function to initialize the chat
export function initInstructorChat() {
  // Initial setup when page loads
  renderChatList();
  // Set up auto-reconnect for chat subscriptions
  window.addEventListener("online", () => {
    console.log("Network connection restored, reconnecting chat subscriptions");
    setupAllChatSubscriptions();
  });

  // Cleanup subscriptions when page is unloaded
  window.addEventListener("beforeunload", () => {
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

  // // Add a button to create a new chat (for testing)
  // const createChatBtn = document.createElement("button");
  // createChatBtn.className = "create-chat-btn";
  // createChatBtn.textContent = "Refresh Chats";
  // createChatBtn.addEventListener("click", () => {
  //   renderChatList();
  // });

  // // Add clear chat history button
  // const clearChatBtn = document.createElement("button");
  // clearChatBtn.className = "clear-chat-btn";
  // clearChatBtn.textContent = "Clear Chat";
  // clearChatBtn.style.display = "none"; // Hide initially

  // clearChatBtn.addEventListener("click", async () => {
  //   if (!currentChatId) return;

  //   if (confirm("Are you sure you want to clear this chat history?")) {
  //     try {
  //       const { error } = await supaClient
  //         .from("message")
  //         .delete()
  //         .eq("chat_id", currentChatId);

  //       if (error) throw error;

  //       // Refresh messages
  //       const messagesContainer = document.querySelector(
  //         ".chat__messages-container"
  //       );
  //       messagesContainer.innerHTML = "";
  //       const emptyMessage = document.createElement("div");
  //       emptyMessage.classList.add("empty-messages");
  //       emptyMessage.textContent =
  //         "Chat history cleared. Start a new conversation!";
  //       messagesContainer.appendChild(emptyMessage);

  //       // Update chat preview
  //       const chatItem = document.querySelector(
  //         `.chat__item[data-chat-id="${currentChatId}"]`
  //       );
  //       if (chatItem) {
  //         const lastMessageEl = chatItem.querySelector(".chat__last-message");
  //         if (lastMessageEl) {
  //           lastMessageEl.textContent = "No messages yet...";
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Error clearing chat:", error);
  //       alert("Failed to clear chat. Please try again.");
  //     }
  //   }
  // });

  // Add export chat button
  const exportChatBtn = document.createElement("button");
  exportChatBtn.className = "export-chat-btn";
  exportChatBtn.textContent = "Export Chat";
  exportChatBtn.style.display = "none"; // Hide initially

  exportChatBtn.addEventListener("click", async () => {
    if (!currentChatId) return;

    try {
      // Fetch all messages for current chat
      const { data, error } = await supaClient
        .from("message")
        .select("*")
        .eq("chat_id", currentChatId)
        .order("msg_date_time", { ascending: true });

      if (error) throw error;

      // Format messages for export
      let exportText = `Chat Export - ${chatName.textContent}\n`;
      exportText += `Generated on ${new Date().toLocaleString()}\n\n`;

      // Process each message
      for (const message of data) {
        const senderName = await safeGetUserName(message.senderid);
        const date = new Date(message.msg_date_time).toLocaleString();
        exportText += `[${date}] ${senderName}: ${message.msg_content}\n\n`;
      }

      // Create blob and download
      const blob = new Blob([exportText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat_export_${chatName.textContent}_${
        new Date().toISOString().split("T")[0]
      }.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting chat:", error);
      alert("Failed to export chat. Please try again.");
    }
  });

  // Add buttons to the header
  const chatHeader = document.querySelector(".chat__header");
  if (chatHeader) {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "chat-header-buttons";
    buttonContainer.appendChild(clearChatBtn);
    buttonContainer.appendChild(exportChatBtn);
    chatHeader.appendChild(buttonContainer);
  }

  // Add refresh button to chats header
  const chatsHeader = document.querySelector(".chats__header");
  if (chatsHeader) {
    chatsHeader.appendChild(createChatBtn);
  }

  // Show action buttons when a chat is selected
  document.addEventListener("click", (e) => {
    if (e.target.closest(".chat__item")) {
      clearChatBtn.style.display = "block";
      exportChatBtn.style.display = "block";
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
}

// Automatically initialize chat if instructorId exists
if (instructorId) {
  document.addEventListener("DOMContentLoaded", initInstructorChat);
} else {
  console.error(
    "No instructor ID found in session storage. Chat initialization skipped."
  );
}

async function getStudentName(studentId) {
  const { data, error } = await supaClient
    .from("student")
    .select("student_name")
    .eq("student_id", studentId);
  if (error) {
    console.error("Error fetching student name:", error);
    return null;
  }
  if (data && data.length > 0) {
    // const name = data[0].student_name;
    // userName.textContent = name;
    return data[0].student_name;
  }
}
