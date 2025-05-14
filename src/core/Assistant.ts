import { Chat, ChatOptions, ChatTheme, ChatPosition } from "../components/Chat";
import {
  FloatingButton,
  FloatingButtonOptions,
  FloatingButtonPosition,
  ButtonSize,
} from "../components/FloatingButton";

/**
 * Configuration options for the assistant
 */
export interface AssistantOptions {
  /** Required API Key for authentication */
  apiKey: string;
  /** Title of the chat window */
  title?: string;
  /** Placeholder text for the text area */
  placeholder?: string;
  /** Position of the button and chat window */
  position?: ChatPosition;
  /** Initial message from the assistant */
  initialMessage?: string;
  /** Specific options for the floating button */
  buttonOptions?: {
    /** Background color of the button */
    backgroundColor?: string;
    /** Color of the icon/text */
    color?: string;
    /** Content of the button (icon or text) */
    icon?: string;
    /** Size of the button */
    size?: ButtonSize;
    /** Selector of the container where to mount the button */
    container?: HTMLElement | string;
  };
  /** Theme options for the chat */
  theme?: ChatTheme;
  /** Selector of the container where to mount the chat */
  container?: HTMLElement | string;
  /** Whether to show the chat automatically on startup */
  autoOpen?: boolean;
}

/**
 * Assistant interface
 */
export interface Assistant {
  /** Show the chat */
  open: () => void;
  /** Hide the chat */
  close: () => void;
  /** Toggle between showing/hiding the chat */
  toggle: () => void;
  /** Unmount the assistant (button and chat) */
  unmount: () => void;
  /** Check if the chat is open */
  isOpen: () => boolean;
  /** Hide the floating button */
  hideButton: () => void;
  /** Show the floating button */
  showButton: () => void;
}

/**
 * Creates a complete assistant with floating button and chat
 * @param options Configuration options for the assistant
 * @returns Assistant instance
 */
export function createAssistant(options: AssistantOptions): Assistant {
  if (!options.apiKey) {
    throw new Error("apiKey is required to initialize the assistant");
  }

  // Floating button options
  const buttonOptions: FloatingButtonOptions = {
    position: (options.position as FloatingButtonPosition) || "bottom-right",
    backgroundColor: options.buttonOptions?.backgroundColor || "#4a90e2",
    color: options.buttonOptions?.color || "#ffffff",
    icon: options.buttonOptions?.icon || "💬",
    size: options.buttonOptions?.size || "medium",
    container: options.buttonOptions?.container || document.body,
  };

  // Chat options (without onSend, it will be handled internally)
  const chatOptions: ChatOptions = {
    title: options.title || "IA Assistant",
    placeholder: options.placeholder || "Write your message here...",
    position: options.position || "bottom-right",
    initialMessage: options.initialMessage,
    theme: {
      primaryColor:
        options.theme?.primaryColor ||
        options.buttonOptions?.backgroundColor ||
        "#4a90e2",
      textColor: options.theme?.textColor || "#333333",
      backgroundColor: options.theme?.backgroundColor || "#ffffff",
      userMessageBgColor:
        options.theme?.userMessageBgColor ||
        options.theme?.primaryColor ||
        options.buttonOptions?.backgroundColor ||
        "#4a90e2",
      userMessageTextColor: options.theme?.userMessageTextColor || "#ffffff",
      assistantMessageBgColor:
        options.theme?.assistantMessageBgColor || "#f1f1f1",
      assistantMessageTextColor:
        options.theme?.assistantMessageTextColor ||
        options.theme?.textColor ||
        "#333333",
      inputBorderColor: options.theme?.inputBorderColor || "#e0e0e0",
      inputBgColor: options.theme?.inputBgColor || "#ffffff",
      inputTextColor:
        options.theme?.inputTextColor || options.theme?.textColor || "#333333",
    },
    isOpen: options.autoOpen || false,
  };

  // Create components
  const button = new FloatingButton(buttonOptions);
  let chat: Chat | null = null;
  let conversationId: string | null = null;
  let pendingOpen = false;

  // Mount components
  button.mount();

  // Function to get all conversations
  async function fetchAllConversations() {
    try {
      const response = await fetch(
        "http://15.228.163.232/assistant-api/conversation/user",
        {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${options.apiKey}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Error fetching conversations: ${response.status}`);
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  }

  // Function to get message history
  async function fetchMessages(conversationId: string) {
    try {
      const response = await fetch(
        `http://15.228.163.232/assistant-api/conversation/${conversationId}`,
        {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${options.apiKey}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Error fetching messages: ${response.status}`);
      }
      const data = await response.json();
      return data.data.messages || [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }

  // Function to send message
  async function sendMessageToApi(
    message: string,
    context: string = ""
  ): Promise<string> {
    if (!conversationId) return "No active conversation.";

    if (context == "") {
      context = document.body.innerText;
    }

    try {
      const response = await fetch(
        `http://15.228.163.232/assistant-api/conversation/${conversationId}/message`,
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": `${options.apiKey}`,
          },
          body: JSON.stringify({ content: message, context: context }),
        }
      );
      if (!response.ok) {
        throw new Error(`Error sending message: ${response.status}`);
      }
      const data = await response.json();
      const assistantMsg = data.data
        .reverse()
        .find((msg: any) => msg.sender === "assistant");
      return assistantMsg
        ? assistantMsg.content
        : "No response from the assistant.";
    } catch (error) {
      console.error("Error sending message:", error);
      return "Sorry, there was an error processing your message. Please try again.";
    }
  }

  // Logic to create a conversation on startup
  async function createConversationAndMountChat() {
    try {
      const response = await fetch(
        "http://15.228.163.232/assistant-api/conversation/",
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Authorization: `bearer ${options.apiKey}`,
          },
          body: JSON.stringify({ title: chatOptions.title }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error creating conversation: ${response.status}`);
      }

      const data = await response.json();
      conversationId = data.data.id;

      // Instantiate the chat with the internal send function
      chat = new Chat({
        ...chatOptions,
        onSend: async (message: string) => {
          const textarea = document.querySelector(
            ".ia-chat-input"
          ) as HTMLTextAreaElement;
          const trimmedMessage = message.trim();

          if (trimmedMessage) {
            const response = await sendMessageToApi(trimmedMessage);
            textarea.value = "";
            return response;
          }
          return "Please write a valid message.";
        },
      });
      chat.mount(options.container || document.body);

      // Load message history
      if (conversationId && chat) {
        const messages = await fetchMessages(conversationId);
        messages.forEach((msg: any) => {
          if (chat && typeof chat["addMessage"] === "function") {
            chat["addMessage"](
              msg.content,
              msg.sender === "user" ? "user" : "assistant"
            );
          }
        });
      }

      // If the user tried to open the chat before it was ready, open it now
      if (pendingOpen) {
        chat.open();
        pendingOpen = false;
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
      // Create an emergency chat that displays the error
      chat = new Chat({
        ...chatOptions,
        onSend: async () =>
          "The assistant is not available at this time. Please try again later.",
        initialMessage:
          "Sorry, I couldn't connect to the server. Please check your connection and try again.",
      });
      chat.mount(options.container || document.body);
      if (pendingOpen) {
        chat.open();
        pendingOpen = false;
      }
    }
  }

  // Start the conversation and mount the chat
  createConversationAndMountChat();

  // Configure interaction
  button.setOnClick(() => {
    if (chat) {
      chat.toggle();
    } else {
      // If the chat is not yet ready, save the attempt
      pendingOpen = true;
    }
  });

  // Return public API
  return {
    open: () => chat && chat.open(),
    close: () => chat && chat.close(),
    toggle: () => chat && chat.toggle(),
    unmount: () => {
      chat && chat.unmount();
      button.unmount();
    },
    isOpen: () => !!(chat && chat["isOpen"]),
    hideButton: () => button.hide(),
    showButton: () => button.show(),
  };
}
