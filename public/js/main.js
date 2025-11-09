// Dark Mode Toggle
const themeToggle = document.getElementById("themeToggle")
const htmlElement = document.documentElement

// Load saved theme preference
const savedTheme = localStorage.getItem("theme") || "light"
if (savedTheme === "dark") {
  htmlElement.classList.add("dark-mode")
  themeToggle.textContent = "☀️"
}

themeToggle.addEventListener("click", () => {
  htmlElement.classList.toggle("dark-mode")
  const isDarkMode = htmlElement.classList.contains("dark-mode")
  localStorage.setItem("theme", isDarkMode ? "dark" : "light")
  themeToggle.textContent = isDarkMode ? "☀️" : "🌙"
})

// Mobile Menu Toggle
const hamburger = document.getElementById("hamburger")
const navLinks = document.querySelector(".nav-links")

if (hamburger) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active")
  })

  // Close menu when a link is clicked
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active")
    })
  })
}

// Set active nav link based on current page
function setActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html"
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const href = link.getAttribute("href")
    if (href === currentPage || (currentPage === "" && href === "index.html")) {
      link.classList.add("active")
    } else {
      link.classList.remove("active")
    }
  })
}

setActiveNavLink()

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({ behavior: "smooth" })
    }
  })
})

// Utility function for API calls
async function fetchAPI(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Fetch error:", error)
    throw error
  }
}

// Show notification
function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === "success" ? "#28a745" : type === "error" ? "#dc3545" : "#0066cc"};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `
  document.body.appendChild(notification)

  setTimeout(() => {
    notification.remove()
  }, 3000)
}
