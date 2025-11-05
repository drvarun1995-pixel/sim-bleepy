import { mergeAttributes, Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ImageResizeNodeComponent } from "./image-resize-node"
import type { NodeType } from "@tiptap/pm/model"

export interface ImageResizeNodeOptions {
  /**
   * HTML attributes to add to the image element.
   * @default {}
   */
  HTMLAttributes: Record<string, any>
  /**
   * Whether images are inline or block
   * @default false
   */
  inline: boolean
  /**
   * Whether images can be resized
   * @default true
   */
  allowBase64: boolean
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageResize: {
      /**
       * Add an image
       */
      setImage: (options: {
        src: string
        alt?: string
        title?: string
        width?: number | string
        height?: number | string
        align?: "left" | "center" | "right"
      }) => ReturnType
    }
  }
}

export const ImageResizeNode = Node.create<ImageResizeNodeOptions>({
  name: "imageResize",

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
    }
  },

  inline() {
    return this.options.inline
  },

  group() {
    return this.options.inline ? "inline" : "block"
  },

  draggable: false, // Prevent drag-to-copy behavior

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("width")
          return width ? parseInt(width, 10) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {}
          }
          return {
            width: attributes.width,
          }
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const height = element.getAttribute("height")
          return height ? parseInt(height, 10) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {}
          }
          return {
            height: attributes.height,
          }
        },
      },
      align: {
        default: "left",
        parseHTML: (element) => {
          const align = element.getAttribute("data-align") || element.style.textAlign || element.style.float
          if (align === "left" || align === "center" || align === "right") {
            return align
          }
          return "left"
        },
        renderHTML: (attributes) => {
          const alignValue = attributes.align || "left"
          const styleParts: string[] = []
          
          if (alignValue === "center") {
            styleParts.push("display: block", "margin: 0.5em auto", "text-align: center")
          } else if (alignValue === "left") {
            styleParts.push("float: left", "margin: 0.5em 1em 0.5em 0", "clear: left")
          } else if (alignValue === "right") {
            styleParts.push("float: right", "margin: 0.5em 0 0.5em 1em", "clear: right")
          }
          
          return {
            "data-align": alignValue,
            style: styleParts.length > 0 ? styleParts.join("; ") : undefined,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: this.options.allowBase64
          ? "img[src]"
          : "img[src]:not([src^=\"data:\"])",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeNodeComponent, {
      // Disable drag-to-position functionality
      contentDOMElementTag: "div",
    })
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})

