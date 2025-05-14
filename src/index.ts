/**
 * Assistant AI - Library to integrate an AI assistant chat into any web application
 *
 * @module assistant-ia
 */

import {
  Notification,
  NotificationType,
  NotificationOptions,
} from "./core/Notification";
import {
  FloatingButton,
  FloatingButtonOptions,
  FloatingButtonPosition,
  ButtonSize,
} from "./components/FloatingButton";
import { Chat, ChatOptions, ChatTheme, ChatPosition } from "./components/Chat";
import { createAssistant, AssistantOptions } from "./core/Assistant";

// Export main components
export {
  // Main components
  Notification,
  FloatingButton,
  Chat,
  createAssistant,

  // Types
  NotificationType,
  NotificationOptions,
  FloatingButtonOptions,
  FloatingButtonPosition,
  ButtonSize,
  ChatOptions,
  ChatTheme,
  ChatPosition,
  AssistantOptions,
};

// Export public API for direct use
export default createAssistant;
