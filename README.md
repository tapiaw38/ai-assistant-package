# IA Assistant

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
npm install ai-assistant
```

or

```bash
yarn add ai-assistant
```

## Basic Usage

```javascript
import { createAssistant } from "ai-assistant";

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

  // Container for the chat
  container: document.body,

  // Function to process messages (required)
  onSend: async (message) => {
    // Here we process the user's message
    // This function can be asynchronous (return a promise)

    // Example: Integration with an external API
    try {
      const response = await fetch("https://my-api.com/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      return data.reply;
    } catch (error) {
      console.error("Error processing message:", error);
      return "Sorry, there was an error processing your message.";
    }
  },
});
```

## API

Once the assistant is created, you can interact with it through its API:

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

## Advanced Usage

### Individual Components

You can also use the components separately:

```javascript
import { FloatingButton, Chat } from "assistant-ia";

// Create a custom floating button
const button = new FloatingButton({
  position: "top-right",
  backgroundColor: "#ff5722",
  icon: "🤖",
  size: "small",
});

// Create an independent chat
const chat = new Chat({
  title: "Technical Support",
  position: "bottom-left",
  onSend: (message) => `Echo: ${message}`,
});

// Mount the components in the DOM
button.mount();
chat.mount();

// Connect the button with the chat
button.setOnClick(() => {
  chat.toggle();
});
```

### Integration with IA APIs

Example of integration with OpenAI:

```javascript
import { createAssistant } from "assistant-ia";
import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: "your-api-key", // Replace with your API key
});

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
```
