import { Observable } from "@babylonjs/core"
import { Terminal } from "xterm"
import { MessageEntry } from "../lib/decentraland/types"

interface IChatCommand {
  name: string
  description: string
  run: (message: string) => Promise<void>
}

// color = `\u001b[2J\u001b[0;0H` clear

export function addChat(canvas: HTMLCanvasElement) {
  const body = document.getElementsByTagName("body")[0]
  const ENTER = "Enter"
  const ESCAPE = "Escape"
  const TILDE = "`"
  const term = new Terminal({
    disableStdin: true,
    allowTransparency: true,
    fontSize: 16,
    fontFamily: "monospace",
    fontWeight: "bold",
    theme: { background: "rgba(0,0,0,0)" },
  })

  term.resize(80, 25)

  const parent = document.createElement("div")
  parent.id = "console"
  const chatInputElement = document.createElement("input")
  parent.appendChild(chatInputElement)

  const chatCommands: { [key: string]: IChatCommand } = {}

  const onChatMessage = new Observable<string>()

  parent.setAttribute("class", "console")
  chatInputElement.setAttribute("class", "chatInput")
  chatInputElement.setAttribute("required", "required")
  chatInputElement.required = true
  chatInputElement.setAttribute("placeholder", "Type a message... ⏎")

  chatInputElement.addEventListener("keydown", function (event) {
    const message = chatInputElement.value
    if (event.code === ENTER) {
      if (message.length > 0) {
        // Check if message is a command
        if (message[0] === "/") {
          // If no such command was found, provide some feedback
          if (!handleChatCommand(message)) {
            addConsoleMessage({
              isCommand: true,
              message: `That command doesn’t exist. Type /help for a full list of commands.`,
            })
          }
        } else {
          // If the message was not a command ("/cmdname"), then send message through wire
          onChatMessage.notifyObservers(message)
        }
      }

      hideChat()
      chatInputElement.value = ""
      event.stopPropagation()
    } else if (event.key === ESCAPE) {
      hideChat()
      event.stopPropagation()
    }
  })

  window.addEventListener('keydown', (event) => {
    console.log(event.key)
    if (event.key === TILDE) {
      event.stopPropagation()
      if (parent.style.display === "block") {
        hideChat()
        parent.style.display = "none"
      } else {
        parent.style.display = "block"
        showChatInput()
      }
    }
  })

  chatInputElement.addEventListener("blur", function (event) {
    const text = chatInputElement.value.trim()

    if (text.length === 0) {
      hideChat()
    }
  })

  function hideChat() {
    if (inputHasFocus()) {
      chatInputElement.blur()
      canvas.focus()
    }
  }

  function inputHasFocus() {
    return document.activeElement === chatInputElement
  }

  function showChatInput() {
    requestAnimationFrame(() => {
      chatInputElement.focus()
      chatInputElement.selectionEnd = chatInputElement.selectionStart = chatInputElement.value.length
    })
  }

  function handleChatCommand(message: string) {
    const words = message.trim().split(" ")

    const command = words[0].substring(1).trim()
    // Remove command from sentence
    words.shift()
    const restOfMessage = words.join(" ")

    const cmd = chatCommands[command]

    if (cmd) {
      cmd.run(restOfMessage).catch((err) => {
        addConsoleMessage({ isCommand: true, message: err.toString() })
        console.error(err)
      })
      return true
    }

    return null
  }

  function addConsoleMessage(message: MessageEntry) {
    let color = ""

    if (message.color) {
      let r = ((message.color >> 16) & 0xff) / 255
      let g = ((message.color >> 8) & 0xff) / 255
      let b = (message.color & 0xff) / 255
      color = `\u001b[48;2;${r};${g};${b}m`
    }

    if (message.sender) {
      term.writeln(
        `${color}${message.sender}: ${message.isCommand ? ">" : ""} ${message.message.replace(/\n/gm, "\r\n")}`
      )
    } else {
      term.writeln(`${color}${message.isCommand ? "> " : ""}${message.message.replace(/\n/gm, "\r\n")}`)
    }
    term.scrollToBottom()
  }

  term.open(parent)
  // term.on("focus", () => term!.blur());

  body.addEventListener(
    "wheel",
    (e) => {
      if (e.clientY > body.clientHeight - 400 && e.deltaY !== 0) {
        term && term.scrollLines(e.deltaY > 0 ? 1 : -1)
      }
    },
    { passive: true }
  )

  // body.addEventListener(
  //   "wheel",
  //   e => {
  //     e.preventDefault();
  //   },
  //   { passive: false }
  // );

  body.addEventListener("keydown", (e) => {
    if (inputHasFocus()) {
      return
    }

    const path = e.composedPath()

    for (let i = 0; i < path.length; i++) {
      const element = path[i]
      if (element === body) break
      if (element instanceof HTMLInputElement) return
      if (element instanceof HTMLTextAreaElement) return
      if (element instanceof HTMLButtonElement) return
      if (element instanceof HTMLSelectElement) return
    }

    if (e.key.toLocaleLowerCase() == 'enter' || e.key == 'return') {
      showChatInput()
    }
  })

  canvas.parentElement!.appendChild(parent)

  function addChatCommand(name: string, description: string, fn: (message: string) => Promise<void>): void {
    if (chatCommands[name]) {
      // Chat command already registered
      return
    }

    chatCommands[name] = {
      name,
      description,
      run: (message) => fn(message),
    }
  }

  function clearChat() {
    term.clear()
  }

  addChatCommand("help", "Show a list of commands", async (message) => {
    addConsoleMessage({
      isCommand: true,
      message: `Available commands:\n${Object.keys(chatCommands)
        .filter((name) => name !== "help")
        .map((name) => `\t${name}: ${chatCommands[name].description}`)
        .concat("\thelp: Show this list of commands")
        .join("\n")}`,
    })
  })

  addChatCommand("clear", "Clear this console", async (message) => {
    clearChat()
  })

  return {
    addConsoleMessage,
    onChatMessage,
    clearChat,
    addChatCommand
  }
}

