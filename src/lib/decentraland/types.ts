export type Entity = number

export type MessageEntry = {
  isCommand: boolean;
  sender?: string;
  message: string;
  color?: number;
}

export type MessageLoggerFunction = (message: MessageEntry) => void