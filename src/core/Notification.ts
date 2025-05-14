/**
 * Types of notifications that can be sent
 */
export type NotificationType = "info" | "warning" | "error" | "success";

/**
 * Options for configuring notifications
 */
export interface NotificationOptions {
  /** Notification type */
  type: NotificationType;
  /** Message to display */
  message: string;
  /** Notification duration in ms (default: 3000) */
  duration?: number;
}

/**
 * Class to handle notifications in the user interface
 */
export class Notification {
  private readonly type: NotificationType;
  private readonly colors = {
    error: "#ff5252",
    warning: "#ffb142",
    info: "#4a90e2",
    success: "#4caf50",
  };

  /**
   * Creates a new notification instance
   * @param type Notification type (info, warning, error, success)
   */
  constructor(type: NotificationType = "info") {
    this.type = type;
  }

  /**
   * Sends a notification
   * @param message Message to display
   * @param options Additional options (duration)
   */
  async send(
    message: string,
    options: { duration?: number } = {}
  ): Promise<void> {
    const color = this.colors[this.type];
    console.log(
      `%c${this.type.toUpperCase()}: ${message}`,
      `color: ${color}; font-weight: bold`
    );

    // Here you could implement the logic to display a visual notification in the UI
    // For now, it only sends a log to the console
  }
}
