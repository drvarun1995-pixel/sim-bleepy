"use client"

import { NodeViewWrapper } from "@tiptap/react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { NodeViewProps } from "@tiptap/react"
import "@/components/tiptap-node/image-resize-node/image-resize-node.scss"

export const ImageResizeNodeComponent: React.FC<NodeViewProps> = (props) => {
  const { node, updateAttributes, selected, editor } = props
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<"se" | "sw" | "ne" | "nw" | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })

  const { width, height, align, src, alt, title } = node.attrs

  // Calculate image dimensions
  const imgWidth = typeof width === "number" ? width : width ? parseInt(width.toString()) : null
  const imgHeight = typeof height === "number" ? height : height ? parseInt(height.toString()) : null

  // Handle mouse down on resize handles
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: "se" | "sw" | "ne" | "nw") => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      setResizeHandle(handle)
      setStartPos({ x: e.clientX, y: e.clientY })
      if (imgRef.current) {
        const rect = imgRef.current.getBoundingClientRect()
        setStartSize({ width: rect.width, height: rect.height })
      }
    },
    []
  )

  // Handle mouse move for resizing
  useEffect(() => {
    if (!isResizing || !resizeHandle || !imgRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!imgRef.current) return

      const deltaX = e.clientX - startPos.x
      const deltaY = e.clientY - startPos.y

      let newWidth = startSize.width
      let newHeight = startSize.height

      // Calculate new dimensions based on handle
      if (resizeHandle === "se") {
        newWidth = Math.max(50, startSize.width + deltaX)
        newHeight = Math.max(50, startSize.height + deltaY)
      } else if (resizeHandle === "sw") {
        newWidth = Math.max(50, startSize.width - deltaX)
        newHeight = Math.max(50, startSize.height + deltaY)
      } else if (resizeHandle === "ne") {
        newWidth = Math.max(50, startSize.width + deltaX)
        newHeight = Math.max(50, startSize.height - deltaY)
      } else if (resizeHandle === "nw") {
        newWidth = Math.max(50, startSize.width - deltaX)
        newHeight = Math.max(50, startSize.height - deltaY)
      }

      // Maintain aspect ratio if both dimensions are set
      if (imgWidth && imgHeight && startSize.width && startSize.height) {
        const aspectRatio = startSize.width / startSize.height
        if (resizeHandle === "se" || resizeHandle === "nw") {
          newHeight = newWidth / aspectRatio
        } else {
          newHeight = newWidth / aspectRatio
        }
      }

      updateAttributes({ width: Math.round(newWidth), height: Math.round(newHeight) })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeHandle(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, resizeHandle, startPos, startSize, imgWidth, imgHeight, updateAttributes])

  // Handle alignment change
  const handleAlignChange = useCallback(
    (e: React.MouseEvent, newAlign: "left" | "center" | "right") => {
      e.preventDefault()
      e.stopPropagation()
      editor.chain().focus().updateAttributes("imageResize", { align: newAlign }).run()
    },
    [editor]
  )

  // Determine container style based on alignment
  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: "relative",
      maxWidth: "100%",
    }

    if (align === "center") {
      return {
        ...baseStyle,
        display: "block",
        margin: "0.5em auto",
        textAlign: "center",
      }
    } else if (align === "left") {
      return {
        ...baseStyle,
        display: "block",
        float: "left",
        margin: "0.5em 1em 0.5em 0",
        clear: "left",
      }
    } else if (align === "right") {
      return {
        ...baseStyle,
        display: "block",
        float: "right",
        margin: "0.5em 0 0.5em 1em",
        clear: "right",
      }
    }

    return {
      ...baseStyle,
      display: "block",
      float: "left",
      margin: "0.5em 1em 0.5em 0",
    }
  }

  const containerStyle = getContainerStyle()

  // Prevent all drag behavior on the container and image
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  }, [])

  return (
    <NodeViewWrapper
      ref={containerRef}
      className={`image-resize-wrapper ${selected ? "selected" : ""} ${isResizing ? "resizing" : ""}`}
      style={containerStyle}
      data-align={align}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      draggable={false}
      contentEditable={false}
    >
      <div 
        className="image-resize-container"
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        draggable={false}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt || ""}
          title={title || ""}
          width={imgWidth || undefined}
          height={imgHeight || undefined}
          style={{
            maxWidth: "100%",
            height: "auto",
            display: "block",
            userSelect: "none",
            pointerEvents: "auto",
          }}
          draggable={false}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
        {selected && (
          <>
            {/* Resize handles */}
            <div
              className="resize-handle resize-handle-se"
              onMouseDown={(e) => handleResizeStart(e, "se")}
            />
            <div
              className="resize-handle resize-handle-sw"
              onMouseDown={(e) => handleResizeStart(e, "sw")}
            />
            <div
              className="resize-handle resize-handle-ne"
              onMouseDown={(e) => handleResizeStart(e, "ne")}
            />
            <div
              className="resize-handle resize-handle-nw"
              onMouseDown={(e) => handleResizeStart(e, "nw")}
            />
            {/* Alignment controls */}
            <div className="image-align-controls">
              <button
                type="button"
                className={`align-btn ${align === "left" ? "active" : ""}`}
                onClick={(e) => handleAlignChange(e, "left")}
                onMouseDown={(e) => e.stopPropagation()}
                title="Align left"
              >
                ←
              </button>
              <button
                type="button"
                className={`align-btn ${align === "center" ? "active" : ""}`}
                onClick={(e) => handleAlignChange(e, "center")}
                onMouseDown={(e) => e.stopPropagation()}
                title="Align center"
              >
                ↔
              </button>
              <button
                type="button"
                className={`align-btn ${align === "right" ? "active" : ""}`}
                onClick={(e) => handleAlignChange(e, "right")}
                onMouseDown={(e) => e.stopPropagation()}
                title="Align right"
              >
                →
              </button>
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  )
}

