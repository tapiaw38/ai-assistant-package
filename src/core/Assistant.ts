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
  /** Required API Base URL for authentication */
  apiBaseUrl: string;
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
    title: options.title || "Nymia IA Assistant",
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
  let lastContext: string = "";

  // Mount components
  button.mount();

  // Function to get all conversations
  async function fetchAllConversations() {
    try {
      const response = await fetch(`${options.apiBaseUrl}/conversation/user`, {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.apiKey}`,
        },
      });
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
        `${options.apiBaseUrl}/conversation/${conversationId}`,
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

  // Function to process HTML content
  function processHtmlContent(content: string): string {
    // Clean unnecessary escapes
    const cleanContent = content.replace(/\\"/g, '"');

    // Improve image styles
    const processedContent = cleanContent.replace(
      /<img ([^>]*style="[^"]*max-width:[^"]*)"([^>]*)>/g,
      '<img $1; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 10px 0;"$2>'
    );

    return processedContent;
  }

  // Function to send message
  async function sendMessageToApi(
    message: string,
    context: string = ""
  ): Promise<string> {
    if (!conversationId) return "No active conversation.";

    if (context === "") {
      const mainContent = document.querySelector(
        'main, article, .content, #content, [role="main"]'
      ) as HTMLElement;
      if (mainContent) {
        context = mainContent.innerText;
      } else {
        const body = document.body.cloneNode(true) as HTMLElement;
        const elementsToRemove = body.querySelectorAll(
          "nav, header, footer, .sidebar, .navigation, .menu, .ads, script, style, .cookie-banner"
        );
        elementsToRemove.forEach((el) => el.remove());
        context = body.innerText;
      }
    }

    const normalizedContext = context
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 8000);

    const contextToSend =
      normalizedContext === lastContext ? "" : normalizedContext;

    if (contextToSend !== "") {
      lastContext = normalizedContext;
    }

    // Get checkbox state and add query parameter
    const showImages =
      chat && chat.getShowImages ? chat.getShowImages() : false;
    const imageProcessorParam = showImages ? "activate" : "deactivate";
    const url = `${options.apiBaseUrl}/conversation/${conversationId}/message?has_image_processor=${imageProcessorParam}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": `${options.apiKey}`,
        },
        body: JSON.stringify({
          content: message,
          context: contextToSend,
          contextHash: contextToSend
            ? btoa(contextToSend.substring(0, 100))
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error sending message: ${response.status}`);
      }

      const data = await response.json();
      const assistantMsg = data.data
        .reverse()
        .find((msg: any) => msg.sender === "assistant");

      if (assistantMsg) {
        // Process the content to clean HTML and improve styles
        return processHtmlContent(assistantMsg.content);
      }

      return "No response from the assistant.";
    } catch (error) {
      console.error("Error sending message:", error);
      return "Sorry, there was an error processing your message. Please try again.";
    }
  }

  // Logic to create a conversation on startup
  async function createConversationAndMountChat() {
    try {
      const response = await fetch(`${options.apiBaseUrl}/conversation/`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${options.apiKey}`,
        },
        body: JSON.stringify({ title: chatOptions.title }),
      });

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

            // Verify if the response contains HTML
            const containsHtml =
              response.includes("<img") ||
              response.includes("<p>") ||
              response.includes("<br>");

            return {
              content: response,
              isHtml: containsHtml,
            };
          }
          return {
            content: "Please write a valid message.",
            isHtml: false,
          };
        },
      });
      chat.mount(options.container || document.body);

      // Load message history
      if (conversationId && chat) {
        const messages = await fetchMessages(conversationId);
        messages.forEach((msg: any) => {
          if (chat && typeof chat["addMessage"] === "function") {
            const containsHtml =
              msg.content.includes("<img") ||
              msg.content.includes("<p>") ||
              msg.content.includes("<br>");

            chat["addMessage"](
              msg.content,
              msg.sender === "user" ? "user" : "assistant",
              containsHtml
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
        onSend: async () => ({
          content:
            "The assistant is not available at this time. Please try again later.",
          isHtml: false,
        }),
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
