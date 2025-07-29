/**
 * Possible position for the chat window
 */
export type ChatPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

/**
 * Theme options for the chat
 */
export interface ChatTheme {
  /** Primary color for headers and user messages */
  primaryColor?: string;
  /** Text color */
  textColor?: string;
  /** Window background color */
  backgroundColor?: string;
  /** Background color of user messages */
  userMessageBgColor?: string;
  /** Text color of user messages */
  userMessageTextColor?: string;
  /** Background color of assistant messages */
  assistantMessageBgColor?: string;
  /** Text color of assistant messages */
  assistantMessageTextColor?: string;
  /** Input border color */
  inputBorderColor?: string;
  /** Input background color */
  inputBgColor?: string;
  /** Input text color */
  inputTextColor?: string;
}

/**
 * Configuration options for the chat
 */
export interface ChatOptions {
  /** Chat window title */
  title?: string;
  /** Placeholder text for the text area */
  placeholder?: string;
  /** Chat window position */
  position?: ChatPosition;
  /** Window width in pixels */
  width?: number;
  /** Window height in pixels */
  height?: number;
  /** Function to execute when a message is sent */
  onSend?: (
    message: string
  ) =>
    | Promise<string | { content: string; isHtml: boolean }>
    | string
    | { content: string; isHtml: boolean };
  /** Initial assistant message */
  initialMessage?: string;
  /** Theme options */
  theme?: ChatTheme;
  /** Whether it should be open on startup */
  isOpen?: boolean;
  /** Show images option (checkbox) */
  showImagesOption?: boolean;
  /** Enable audio answers (hide text, show audio player) */
  audioAnswers?: boolean;
}

/**
 * Chat Component - Implements a complete chat interface with message handling,
 * input auto-adjustment, animations, and customizable styles
 */
export class Chat {
  private container: HTMLDivElement;
  private chatWindow: HTMLDivElement;
  private messageList: HTMLDivElement;
  private inputArea: HTMLDivElement;
  private isOpen: boolean = false;
  private options: Required<Omit<ChatOptions, "audioAnswers">> & {
    showImagesOption?: boolean;
    audioAnswers?: boolean;
  };
  private onNewConversationCallback?: () => void;
  private newConvButton?: HTMLButtonElement;

  /**
   * Creates a new Chat instance
   * @param options Configuration options
   */
  constructor(options: ChatOptions = {}) {
    this.options = {
      title: options.title || "IA Assistant",
      placeholder: options.placeholder || "Write your message here...",
      position: options.position || "bottom-right",
      width: options.width || 350,
      height: options.height || 450,
      onSend: options.onSend || (async (message) => `Received: ${message}`),
      initialMessage: options.initialMessage || "Hello, how can I help you?",
      theme: {
        primaryColor: options.theme?.primaryColor || "#4a90e2",
        textColor: options.theme?.textColor || "#333333",
        backgroundColor: options.theme?.backgroundColor || "#ffffff",
        userMessageBgColor:
          options.theme?.userMessageBgColor ||
          options.theme?.primaryColor ||
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
          options.theme?.inputTextColor ||
          options.theme?.textColor ||
          "#333333",
      },
      isOpen: options.isOpen || false,
      showImagesOption: !!options.showImagesOption,
      ...(typeof options.audioAnswers !== "undefined"
        ? { audioAnswers: !!options.audioAnswers }
        : {}),
    };

    this.createChatElements();
    this.addEventListeners();
    this.loadStyles();
    this.addInitialMessage();

    // Open the chat if specified in the options
    if (this.options.isOpen) {
      this.open();
    }
  }

  /**
   * Creates the DOM elements for the chat
   */
  private createChatElements(): void {
    // Main container
    this.container = document.createElement("div");
    this.container.className = "ia-chat-container";
    this.container.style.display = "none";

    // Chat window
    this.chatWindow = document.createElement("div");
    this.chatWindow.className = `ia-chat-window ${this.options.position}`;

    // Header
    const header = document.createElement("div");
    header.className = "ia-chat-header";

    const title = document.createElement("div");
    title.className = "ia-chat-title";
    title.textContent = this.options.title;

    // New conversation button (+)
    const newConvButton = document.createElement("button");
    newConvButton.className = "ia-chat-new-conv";
    newConvButton.innerHTML = "Nueva conversación";
    newConvButton.title = "Nueva conversación";
    newConvButton.setAttribute("type", "button");
    // Match close button style, but remove right margin
    newConvButton.style.background = "none";
    newConvButton.style.border = "none";
    newConvButton.style.color = "white";
    newConvButton.style.fontSize = "11px";
    newConvButton.style.cursor = "pointer";
    newConvButton.style.padding = "0";
    newConvButton.style.marginLeft = "60px";
    newConvButton.style.marginRight = "2px";
    newConvButton.style.lineHeight = "1";
    newConvButton.style.outline = "none";

    this.newConvButton = newConvButton;
    if (this.onNewConversationCallback) {
      newConvButton.onclick = this.onNewConversationCallback;
    }

    // Close button
    const closeButton = document.createElement("button");
    closeButton.className = "ia-chat-close";
    closeButton.innerHTML = "&times;";
    closeButton.setAttribute("aria-label", "Close chat");
    closeButton.setAttribute("type", "button");
    closeButton.style.background = "none";
    closeButton.style.border = "none";
    closeButton.style.color = "white";
    closeButton.style.fontSize = "24px";
    closeButton.style.cursor = "pointer";
    closeButton.style.padding = "0";
    closeButton.style.marginLeft = "0";
    closeButton.style.lineHeight = "1";
    closeButton.style.outline = "none";

    header.appendChild(title);
    header.appendChild(newConvButton);
    header.appendChild(closeButton);

    // Message list
    this.messageList = document.createElement("div");
    this.messageList.className = "ia-chat-messages";

    // Input area
    this.inputArea = document.createElement("div");
    this.inputArea.className = "ia-chat-input-area";

    // Checkbox for showing images
    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "ia-chat-checkbox-container";
    checkboxContainer.style.display =
      this.options.showImagesOption === false ? "none" : "flex";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "ia-show-images";
    checkbox.className = "ia-chat-checkbox";
    checkbox.title =
      "Al activar esta opción tu respuesta puede demorar más de lo esperado";

    const label = document.createElement("label");
    label.htmlFor = "ia-show-images";
    label.className = "ia-chat-checkbox-label";
    label.textContent = "Mostrar imágenes en la respuesta";
    label.title =
      "Al activar esta opción tu respuesta puede demorar más de lo esperado";

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);

    // CHANGE: Create div wrapper for the textarea for better control
    const textareaWrapper = document.createElement("div");
    textareaWrapper.className = "ia-chat-input-wrapper";

    const textarea = document.createElement("textarea");
    textarea.className = "ia-chat-input";
    textarea.placeholder = this.options.placeholder;
    textarea.rows = 1;
    // Set inline styles to override any calculated style
    textarea.style.height = "42px";
    textarea.style.minHeight = "42px";
    textarea.style.maxHeight = "120px";
    textarea.style.overflowY = "hidden";
    textarea.style.resize = "none";
    textarea.setAttribute("aria-label", "Message");

    const sendButton = document.createElement("button");
    sendButton.className = "ia-chat-send";
    sendButton.innerHTML = "&#10148;";
    sendButton.setAttribute("aria-label", "Send message");
    sendButton.setAttribute("type", "button");

    // CHANGE: Add the textarea to the wrapper, then the wrapper to the inputArea
    textareaWrapper.appendChild(textarea);
    this.inputArea.appendChild(textareaWrapper);
    this.inputArea.appendChild(sendButton);

    // Assemble components
    this.chatWindow.appendChild(header);
    this.chatWindow.appendChild(this.messageList);
    this.chatWindow.appendChild(checkboxContainer);
    this.chatWindow.appendChild(this.inputArea);
    this.container.appendChild(this.chatWindow);
  }

  /**
   * Adds the necessary event listeners
   */
  private addEventListeners(): void {
    // Close button
    const closeButton = this.chatWindow.querySelector(
      ".ia-chat-close"
    ) as HTMLButtonElement;
    closeButton.addEventListener("click", () => {
      this.toggle();
      // Remove focus from the button after clicking
      closeButton.blur();
    });

    // Send button
    const sendButton = this.chatWindow.querySelector(
      ".ia-chat-send"
    ) as HTMLButtonElement;
    sendButton.addEventListener("click", () => {
      this.sendMessage();
      // Remove focus from the button after clicking
      sendButton.blur();
    });

    // Send with Enter, new line with Shift+Enter
    const textarea = this.chatWindow.querySelector(
      ".ia-chat-input"
    ) as HTMLTextAreaElement;

    // Set initial height
    textarea.style.height = "42px";

    // Handle keyboard events
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      } else {
        // For any other key, adjust the height in the next cycle
        setTimeout(() => this.autoResizeTextarea(textarea), 0);
      }
    });

    // Auto-adjust on each content change
    textarea.addEventListener("input", () => {
      this.autoResizeTextarea(textarea);
    });

    // Also adjust on focus
    textarea.addEventListener("focus", () => {
      this.autoResizeTextarea(textarea);
    });

    // Click outside to close
    document.addEventListener("click", (e) => {
      if (
        this.isOpen &&
        !this.container.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest(".floating-button")
      ) {
        this.toggle();
      }
    });

    // Reproducir audio si existe un botón de audio
    this.messageList.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (
        target.classList.contains("ia-audio-play-btn") ||
        target.closest(".ia-audio-play-btn")
      ) {
        const btn = target.classList.contains("ia-audio-play-btn")
          ? target
          : target.closest(".ia-audio-play-btn");
        const audio = btn?.parentElement?.querySelector(
          ".ia-audio-player"
        ) as HTMLAudioElement;
        if (audio) {
          audio.style.display = "block";
          audio.play();
        }
      }
    });
  }

  /**
   * Automatically adjusts the height of the textarea according to its content
   */
  private autoResizeTextarea(textarea: HTMLTextAreaElement): void {
    // Save the current scroll position
    const scrollPos = this.messageList.scrollTop;

    // First reset the height to get an accurate scrollHeight
    textarea.style.height = "42px";

    // Calculate new height based on content
    const newHeight = Math.min(textarea.scrollHeight, 120);

    // Apply the new height
    textarea.style.height = `${newHeight}px`;

    if (newHeight > 42) {
      // The content requires more than one line
      textarea.classList.add("multiline");
      textarea.style.overflowY = newHeight >= 120 ? "auto" : "hidden";
    } else {
      // The content fits on one line
      textarea.classList.remove("multiline");
      textarea.style.overflowY = "hidden";
    }

    // Restore the scroll position
    this.messageList.scrollTop = scrollPos;
  }

  /**
   * Resets the textarea to its initial state
   */
  private resetTextarea(textarea: HTMLTextAreaElement): void {
    textarea.value = "";
    textarea.classList.remove("multiline");
    textarea.style.height = "42px";
    textarea.style.minHeight = "42px";
    textarea.style.overflowY = "hidden";
  }

  /**
   * Sends a message and processes the response
   */
  private async sendMessage(): Promise<void> {
    const textarea = this.chatWindow.querySelector(
      ".ia-chat-input"
    ) as HTMLTextAreaElement;
    const message = textarea.value.trim();

    if (message) {
      // Add user message
      this.addMessage(message, "user");

      // Clear and reset input
      this.resetTextarea(textarea);

      // Show typing indicator
      this.showTypingIndicator();

      try {
        // Get response (can be a promise or a direct string)
        const response = await this.options.onSend(message);

        // Remove indicator and show response
        this.hideTypingIndicator();

        // Handle different response types
        if (typeof response === "string") {
          this.addMessage(response, "assistant");
        } else if (
          response &&
          typeof response === "object" &&
          "content" in response
        ) {
          this.addMessage(
            response.content,
            "assistant",
            response.isHtml || false
          );
        } else {
          this.addMessage("Invalid response format", "error");
        }
      } catch (error) {
        this.hideTypingIndicator();
        this.addMessage(
          "Sorry, an error occurred while processing your message.",
          "error"
        );
        console.error("Chat error:", error);
      }

      // Scroll to the end
      this.scrollToBottom();
    }
  }

  /**
   * Adds a message to the chat
   * @param text Message text
   * @param sender Message sender (user, assistant, error)
   * @param isHtml Whether the text contains HTML (only for assistant messages)
   */
  private addMessage(
    text: string,
    sender: "user" | "assistant" | "error",
    isHtml: boolean = false
  ): void {
    const messageElement = document.createElement("div");
    messageElement.className = `ia-chat-message ${sender}`;

    if (this.options.audioAnswers && sender === "assistant") {
      const audioUrlMatch = text.match(/"audio_url"\s*:\s*"([^"]+)"/s);
      if (audioUrlMatch) {
        const audioUrl = audioUrlMatch[1];

        const audioContainer = document.createElement("div");
        audioContainer.className = "ia-audio-container";

        const playButton = document.createElement("button");
        playButton.className = "ia-audio-play-btn";
        playButton.innerHTML = `
          <svg class="ia-audio-icon" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Audio
        `;

        const audioPlayer = document.createElement("audio");
        audioPlayer.className = "ia-audio-player";
        audioPlayer.src = audioUrl;
        audioPlayer.controls = true;
        audioPlayer.style.display = "none";

        audioContainer.appendChild(playButton);
        audioContainer.appendChild(audioPlayer);
        messageElement.appendChild(audioContainer);

        this.messageList.appendChild(messageElement);
        this.scrollToBottom();
        return;
      }

      return;
    }

    if (isHtml && sender === "assistant") {
      // If the message is HTML, sanitize it before inserting
      messageElement.innerHTML = this.sanitizeHtml(text);
    } else {
      // Sanitize the text (prevent XSS)
      const sanitizedText = this.sanitizeText(text);

      // Format text (looking for URLs, etc.)
      const formattedText = this.formatText(sanitizedText);

      messageElement.innerHTML = formattedText;
    }

    this.messageList.appendChild(messageElement);
    this.scrollToBottom();
  }

  /**
   * Sanitizes the text to prevent XSS
   */
  private sanitizeText(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Sanitizes HTML to allow only safe tags for assistant messages
   */
  private sanitizeHtml(html: string): string {
    // Create a temporary element to clean the HTML
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // Define allowed tags and attributes
    const allowedTags = ["img", "br", "p", "strong", "em", "b", "i"];
    const allowedAttributes: { [key: string]: string[] } = {
      img: ["src", "alt", "style", "width", "height"],
      p: ["style"],
      strong: [],
      em: [],
      b: [],
      i: [],
      br: [],
    };

    this.cleanElement(temp, allowedTags, allowedAttributes);

    return temp.innerHTML;
  }

  /**
   * Recursively clean HTML elements
   */
  private cleanElement(
    element: HTMLElement,
    allowedTags: string[],
    allowedAttributes: { [key: string]: string[] }
  ): void {
    const children = Array.from(element.children);

    children.forEach((child) => {
      const tagName = child.tagName.toLowerCase();

      if (!allowedTags.includes(tagName)) {
        // Remove disallowed elements
        element.removeChild(child);
      } else {
        // Clean disallowed attributes
        const allowedAttrs = allowedAttributes[tagName] || [];
        const attributes = Array.from(child.attributes);

        attributes.forEach((attr) => {
          if (!allowedAttrs.includes(attr.name)) {
            child.removeAttribute(attr.name);
          }
        });

        // Recursively clean children
        this.cleanElement(child as HTMLElement, allowedTags, allowedAttributes);
      }
    });
  }

  /**
   * Formats the text by detecting links, titles, and lists
   */
  private formatText(text: string): string {
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let formatted = text.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Titles in **bold** => <span class="ia-title">...</span>
    formatted = formatted.replace(
      /\*\*(.*?)\*\*/g,
      '<span class="ia-title">$1</span>'
    );

    // Lists with - at the beginning of the line
    // First, convert lines starting with - to <li>
    formatted = formatted.replace(
      /(^|\n)-\s+(.*?)(?=\n|$)/g,
      (match, p1, p2) => `${p1}<li>${p2}</li>`
    );
    // Then, wrap consecutive <li> elements in <ul>
    formatted = formatted.replace(
      /(<li>.*?<\/li>\s*)+/gs,
      (match) => `<ul>${match.replace(/\s*$/, "")}</ul>`
    );

    return formatted;
  }

  /**
   * Shows the typing indicator
   */
  private showTypingIndicator(): void {
    const typingElement = document.createElement("div");
    typingElement.className = "ia-chat-message assistant typing";
    typingElement.innerHTML =
      '<span class="ia-typing-dot"></span><span class="ia-typing-dot"></span><span class="ia-typing-dot"></span>';
    typingElement.id = "ia-typing-indicator";
    this.messageList.appendChild(typingElement);
    this.scrollToBottom();
  }

  /**
   * Hides the typing indicator
   */
  private hideTypingIndicator(): void {
    const typingElement = document.getElementById("ia-typing-indicator");
    if (typingElement) {
      typingElement.remove();
    }
  }

  /**
   * Scrolls to the end of the message list
   */
  private scrollToBottom(): void {
    this.messageList.scrollTop = this.messageList.scrollHeight;
  }

  /**
   * Adds the initial assistant message
   */
  private addInitialMessage(): void {
    if (this.options.initialMessage) {
      this.addMessage(this.options.initialMessage, "assistant");
    }
  }

  /**
   * Toggles between showing and hiding the chat
   */
  public toggle(): void {
    this.isOpen = !this.isOpen;
    this.container.style.display = this.isOpen ? "block" : "none";

    if (this.isOpen) {
      // Focus the textarea when opened
      setTimeout(() => {
        const textarea = this.chatWindow.querySelector(
          ".ia-chat-input"
        ) as HTMLTextAreaElement;
        textarea.style.height = "42px"; // Reset initial height
        textarea.focus();
      }, 100);

      // Scroll to the end
      this.scrollToBottom();
    }
  }

  /**
   * Opens the chat
   */
  public open(): void {
    if (!this.isOpen) {
      this.toggle();
    }
  }

  /**
   * Closes the chat
   */
  public close(): void {
    if (this.isOpen) {
      this.toggle();
    }
  }

  /**
   * Mounts the chat in the DOM
   * @param container Element or selector where to mount the chat
   */
  public mount(container: HTMLElement | string = document.body): void {
    const targetContainer =
      typeof container === "string"
        ? (document.querySelector(container) as HTMLElement)
        : container;

    if (targetContainer) {
      targetContainer.appendChild(this.container);
    }
  }

  /**
   * Unmounts the chat from the DOM
   */
  public unmount(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  /**
   * Gets the state of the show images checkbox
   * @returns boolean indicating if images should be shown
   */
  public getShowImages(): boolean {
    const checkbox = this.chatWindow.querySelector(
      "#ia-show-images"
    ) as HTMLInputElement;
    return checkbox ? checkbox.checked : false;
  }

  /**
   * Gets the audio answers setting from options
   * @returns boolean indicating if audio answers are enabled
   */
  public getAudioAnswers(): boolean {
    return !!this.options.audioAnswers;
  }

  /**
   * Sets the callback for the new conversation button
   */
  public setOnNewConversation(callback: () => void): void {
    this.onNewConversationCallback = callback;
    if (this.newConvButton) {
      this.newConvButton.onclick = callback;
    }
  }

  /**
   * Clears all chat messages and resets the visual state
   */
  public clearMessages(): void {
    if (this.messageList) {
      this.messageList.innerHTML = "";
    }
    // Optionally: clear the textarea
    const textarea = this.chatWindow.querySelector(
      ".ia-chat-input"
    ) as HTMLTextAreaElement;
    if (textarea) {
      this.resetTextarea(textarea);
    }
  }

  /**
   * Loads the necessary CSS styles
   */
  private loadStyles(): void {
    // Check if styles are already loaded
    if (document.getElementById("ia-chat-styles")) {
      return;
    }

    const {
      primaryColor,
      textColor,
      backgroundColor,
      userMessageBgColor,
      userMessageTextColor,
      assistantMessageBgColor,
      assistantMessageTextColor,
      inputBorderColor,
      inputBgColor,
      inputTextColor,
    } = this.options.theme;

    const styleElement = document.createElement("style");
    styleElement.id = "ia-chat-styles";
    styleElement.textContent = `
      .ia-chat-container {
        position: fixed;
        z-index: 1001;
        pointer-events: none;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
      }
      
      .ia-chat-window {
        position: absolute;
        width: ${this.options.width}px;
        height: ${this.options.height}px;
        background-color: ${backgroundColor};
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        pointer-events: auto;
        transition: all 0.3s ease;
      }
      
      .ia-chat-window.bottom-right {
        bottom: 90px;
        right: 20px;
      }
      
      .ia-chat-window.bottom-left {
        bottom: 90px;
        left: 20px;
      }
      
      .ia-chat-window.top-right {
        top: 20px;
        right: 20px;
      }
      
      .ia-chat-window.top-left {
        top: 20px;
        left: 20px;
      }
      
      .ia-chat-header {
        background-color: ${primaryColor};
        color: white;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .ia-chat-title {
        font-weight: bold;
        color: white;
        font-size: 1.08em;
        display: inline-block;
        margin-bottom: 2px;
      }
      
      .ia-chat-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
        line-height: 1;
        outline: none; /* Prevent the outline from being displayed on click */
      }
      
      /* Prevent focus visual effects on close button */
      .ia-chat-close:focus {
        outline: none;
        box-shadow: none;
      }
      
      .ia-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .ia-chat-message {
        padding: 10px 14px;
        border-radius: 16px;
        max-width: 80%;
        word-break: break-word;
        line-height: 1.4;
      }
      
      .ia-chat-message.user {
        background-color: ${userMessageBgColor};
        color: ${userMessageTextColor};
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }
      
      .ia-chat-message.assistant {
        background-color: ${assistantMessageBgColor};
        color: ${assistantMessageTextColor};
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      
      .ia-chat-message.error {
        background-color: #ffe6e6;
        color: #d32f2f;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      
      .ia-chat-input-area {
        padding: 12px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        align-items: flex-end;
      }
      
      .ia-chat-input-wrapper {
        flex: 1;
        position: relative;
        display: flex;
      }
      
      .ia-chat-input {
        flex: 1;
        border: 1px solid ${inputBorderColor};
        border-radius: 20px;
        padding: 10px 14px;
        font-family: inherit;
        resize: none;
        box-sizing: border-box;
        outline: none;
        transition: height 0.1s ease-out, border-color 0.2s;
        line-height: 1.4;
        min-height: 42px !important;
        max-height: 120px;
        overflow-y: hidden !important; /* Force hide vertical scroll by default */
        background-color: ${inputBgColor};
        color: ${inputTextColor};
      }
      
      .ia-chat-input.multiline {
        overflow-y: auto !important; /* Only allow scroll when there are multiple lines */
      }
      
      .ia-chat-input:focus {
        border-color: ${primaryColor};
      }
      
      .ia-chat-send {
        background-color: ${primaryColor};
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        margin-left: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: background-color 0.2s;
        outline: none; /* Prevent the outline from being displayed on click */
      }
      
      .ia-chat-send:hover {
        background-color: ${this.darkenColor(primaryColor || "#4a90e2", 10)};
      }
      
      /* Prevent focus visual effects on send button */
      .ia-chat-send:focus {
        outline: none;
        box-shadow: none;
      }
      
      /* Typing indicator */
      .typing {
        display: flex;
        align-items: center;
        padding: 8px 14px;
      }
      
      .ia-typing-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #888;
        margin-right: 4px;
        animation: typing-dot 1.4s infinite ease-in-out both;
      }
      
      .ia-typing-dot:nth-child(1) {
        animation-delay: 0s;
      }
      
      .ia-typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .ia-typing-dot:nth-child(3) {
        animation-delay: 0.4s;
        margin-right: 0;
      }
      
      @keyframes typing-dot {
        0%, 80%, 100% { transform: scale(0.7); opacity: 0.6; }
        40% { transform: scale(1); opacity: 1; }
      }
      
      /* Responsive */
      @media (max-width: 480px) {
        .ia-chat-window {
          width: calc(100% - 40px);
          height: 70vh;
        }
      }
      
      ul {
        margin: 8px 0 8px 18px;
        padding-left: 18px;
      }
      ul li {
        margin-bottom: 2px;
        list-style: disc inside;
      }
      
      .ia-chat-messages::-webkit-scrollbar {
        width: 8px;
        background: transparent;
      }
      .ia-chat-messages::-webkit-scrollbar-thumb {
        background: ${inputBorderColor};
        border-radius: 8px;
      }
      .ia-chat-messages::-webkit-scrollbar-thumb:hover {
        background: ${primaryColor};
      }
      .ia-chat-messages {
        scrollbar-width: thin;
        scrollbar-color: ${inputBorderColor} transparent;
      }
      
      .ia-chat-input::-webkit-scrollbar {
        width: 8px;
        background: transparent;
        border-radius: 20px;
      }
      .ia-chat-input::-webkit-scrollbar-thumb {
        background: ${inputBorderColor};
        border-radius: 20px;
        min-height: 24px;
        border: 2px solid ${inputBgColor};
      }
      .ia-chat-input::-webkit-scrollbar-thumb:hover {
        background: ${primaryColor};
      }
      .ia-chat-input {
        scrollbar-width: thin;
        scrollbar-color: ${inputBorderColor} ${inputBgColor};
      }

      .ia-chat-checkbox-container {
        padding: 12px 12px;
        border-top: 1px solid #e0e0e0;
        background-color: #f8f9fa;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .ia-chat-checkbox {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: ${primaryColor};
      }

      .ia-chat-checkbox-label {
        font-size: 12px;
        color: ${primaryColor};
        cursor: pointer;
        user-select: none;
        margin: 0;
      }
      
      .ia-chat-checkbox-label:hover {
        color: ${primaryColor};
      }

      .ia-chat-message img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin: 10px 0;
        display: block;
      }

      .ia-chat-message.assistant img {
        max-width: 300px;
      }

      .ia-chat-message p {
        margin: 5px 0;
        line-height: 1.4;
      }

      .ia-audio-player {
        display: none;
        width: 100%;
        margin-top: 8px;
      }

      .ia-audio-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 250px;
      }

      .ia-audio-play-btn {
        background-color: ${primaryColor};
        color: white;
        border: none;
        border-radius: 20px;
        padding: 10px 16px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        outline: none;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        min-width: 120px;
        justify-content: center;
      }

      .ia-audio-play-btn:hover {
        background-color: ${this.darkenColor(primaryColor || "#4a90e2", 10)};
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }

      .ia-audio-play-btn:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .ia-audio-icon {
        width: 16px;
        height: 16px;
        display: inline-block;
        fill: white;
        flex-shrink: 0;
      }

      .ia-audio-player {
        width: 100%;
        margin-top: 8px;
        border-radius: 8px;
        outline: none;
      }

      .ia-audio-player::-webkit-media-controls-panel {
        background-color: ${assistantMessageBgColor};
        border-radius: 8px;
      }

      .ia-audio-player::-webkit-media-controls-play-button,
      .ia-audio-player::-webkit-media-controls-pause-button {
        background-color: ${primaryColor};
        border-radius: 50%;
      }
    `;

    document.head.appendChild(styleElement);
  }

  /**
   * Darkens a color by a certain percentage
   */
  private darkenColor(color: string, percent: number): string {
    // If the color is a name, convert it to hex format
    if (!/^#[0-9A-F]{3,6}$/i.test(color)) {
      const tempElement = document.createElement("div");
      tempElement.style.color = color;
      document.body.appendChild(tempElement);
      const computedColor = getComputedStyle(tempElement).color;
      document.body.removeChild(tempElement);

      if (computedColor.startsWith("rgb")) {
        color = this.rgbToHex(computedColor);
      } else {
        color = "#4a90e2"; // Default color if it cannot be converted
      }
    }

    // Remove the # symbol if it exists
    color = color.replace("#", "");

    // Convert to RGB
    let r = parseInt(color.substring(0, 2), 16);
    let g = parseInt(color.substring(2, 4), 16);
    let b = parseInt(color.substring(4, 6), 16);

    // Reduce brightness
    r = Math.floor((r * (100 - percent)) / 100);
    g = Math.floor((g * (100 - percent)) / 100);
    b = Math.floor((b * (100 - percent)) / 100);

    // Convert back to hex format
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Converts an RGB color to hexadecimal format
   */
  private rgbToHex(rgb: string): string {
    // Extract RGB values
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return "#000000";

    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
}
