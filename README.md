# Seely IA Assistant

Library to easily integrate an IA assistant chat into any web application in an easy and customizable way.

## Features

- 🎯 **Easy Integration**: Add an IA assistant to your application with just a few lines of code
- 🎨 **Customizable**: Change colors, position, icons, size and more
- 💬 **Full Chat**: Chat interface with message bubbles, writing animation, and text formatting
- 📱 **Responsive**: Automatically adapts to mobile devices
- 🔍 **Flexible**: Use your own logic to process messages
- ⌨️ **Optimized UX**: Support for keyboard shortcuts and text area auto-adjustment

## Installation

```bash
npm install seely-ai-assistant
```

or

```bash
yarn add seely-ai-assistant
```

## Basic Usage

```javascript
import { createAssistant } from "seely-ai-assistant";

// Create an assistant with minimal configuration
const assistant = createAssistant({
  onSend: async (message) => {
    // Here you can integrate your own logic to respond
    // Connect with your backend, IA API, etc.
    return `Received: ${message}`;
  },
});

// The assistant is ready to use
// The floating button will appear in the bottom right corner
```

## Configuration Options

```javascript
// Assistant with full configuration
const assistant = createAssistant({
  // API Key for the assistant (required)
  apiKey: "your-api-key",
  // API URL for the assistant server (required)
  apiBaseUrl: "http://localhost:8000",
  // General options
  title: "My Assistant",
  placeholder: "How can I help you?",
  position: "bottom-right", // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  initialMessage: "Hello! I am your virtual assistant. How can I help you?",
  autoOpen: false, // If true, the chat will open automatically

  // Specific button options
  buttonOptions: {
    backgroundColor: "#4a90e2",
    color: "#ffffff",
    icon: "💬", // Emoticon or HTML for the button
    size: "medium", // 'small' | 'medium' | 'large'
    container: "#my-container", // Selector or element where to mount the button
  },

  // Chat theme options
  theme: {
    primaryColor: "#4a90e2", // Primary color (header and send button)
    textColor: "#333333", // General text color
    backgroundColor: "#ffffff", // Chat background color
    userMessageBgColor: "#4a90e2", // User message background color
    userMessageTextColor: "#ffffff", // User message text color
    assistantMessageBgColor: "#f1f1f1", // Assistant message background color
    assistantMessageTextColor: "#333333", // Assistant message text color
    inputBorderColor: "#e0e0e0", // Input border color
    inputBgColor: "#ffffff", // Input background color
    inputTextColor: "#333333", // Input text color
  },
});
```

## Methods

You can control the assistant with the following methods:

```javascript
// Open the chat
assistant.open();

// Close the chat
assistant.close();

// Toggle between open/closed
assistant.toggle();

// Check if it's open
const isOpen = assistant.isOpen();

// Hide the floating button (for example, when using your own button)
assistant.hideButton();

// Show the floating button
assistant.showButton();

// Unmount the assistant (remove from the DOM)
assistant.unmount();
```

## License

This project is licensed under the ISC License.
