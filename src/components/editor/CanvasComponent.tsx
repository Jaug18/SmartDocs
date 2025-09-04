import React, { useRef, useEffect, useState, useCallback } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Palette, Trash2, Download } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface DrawingLine {
  id: string
  path: string
  color: string
  size: number
}

interface CanvasComponentProps extends NodeViewProps {
  node: {
    attrs: {
      lines: DrawingLine[]
    }
  }
  updateAttributes: (attrs: any) => void
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({ node, updateAttributes }) => {
  const canvasRef = useRef<SVGSVGElement>(null)
  const [color, setColor] = useState('#A975FF')
  const [size, setSize] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<string>('')
  const [currentId, setCurrentId] = useState<string>('')
  const [points, setPoints] = useState<number[][]>([])

  const generateId = () => `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const getRandomColor = () => {
    const colors = [
      '#A975FF', '#FB5151', '#FD9170', '#FFCB6B', 
      '#68CEF8', '#80CBC4', '#9DEF8F', '#E91E63',
      '#9C27B0', '#673AB7', '#3F51B5', '#2196F3'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Convertir puntos a path SVG usando líneas suaves
  const pointsToPath = useCallback((points: number[][]) => {
    if (points.length < 2) return ''
    
    let path = `M ${points[0][0]} ${points[0][1]}`
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i][0]} ${points[i][1]}`
    }
    
    return path
  }, [])

  // Obtener posición del mouse/touch relativa al SVG
  const getRelativePosition = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return [0, 0]
    
    const rect = canvasRef.current.getBoundingClientRect()
    let clientX: number, clientY: number
    
    if ('touches' in event) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else {
      clientX = event.clientX
      clientY = event.clientY
    }
    
    const x = ((clientX - rect.left) / rect.width) * 500
    const y = ((clientY - rect.top) / rect.height) * 250
    
    return [x, y]
  }, [])

  // Iniciar dibujo
  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault()
    const position = getRelativePosition(event)
    const id = generateId()
    
    setIsDrawing(true)
    setCurrentId(id)
    setPoints([position])
    setCurrentPath(`M ${position[0]} ${position[1]}`)
  }, [getRelativePosition])

  // Continuar dibujo
  const continueDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    
    event.preventDefault()
    const position = getRelativePosition(event)
    
    setPoints(prevPoints => {
      const newPoints = [...prevPoints, position]
      const path = pointsToPath(newPoints)
      setCurrentPath(path)
      return newPoints
    })
  }, [isDrawing, getRelativePosition, pointsToPath])

  // Terminar dibujo
  const endDrawing = useCallback(() => {
    if (!isDrawing || points.length < 2) {
      setIsDrawing(false)
      setPoints([])
      setCurrentPath('')
      return
    }
    
    const path = pointsToPath(points)
    const newLine: DrawingLine = {
      id: currentId,
      path,
      color,
      size,
    }
    
    const updatedLines = [...node.attrs.lines, newLine]
    updateAttributes({ lines: updatedLines })
    
    setIsDrawing(false)
    setPoints([])
    setCurrentPath('')
    
    toast({
      title: "Trazo agregado",
      description: "El dibujo se ha guardado correctamente",
    })
  }, [isDrawing, points, pointsToPath, currentId, color, size, node.attrs.lines, updateAttributes])

  // Limpiar canvas
  const clearCanvas = () => {
    updateAttributes({ lines: [] })
    setIsDrawing(false)
    setPoints([])
    setCurrentPath('')
    
    toast({
      title: "Canvas limpiado",
      description: "Se han eliminado todos los trazos",
    })
  }

  // Exportar como SVG
  const exportSVG = () => {
    if (!canvasRef.current) return
    
    const svgData = new XMLSerializer().serializeToString(canvasRef.current)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'canvas-drawing.svg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Dibujo exportado",
      description: "Se descargó el archivo SVG",
    })
  }

  // Cambiar color aleatorio
  const randomizeColor = () => {
    setColor(getRandomColor())
  }

  // Efectos para eventos del mouse/touch
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDrawing) {
        const syntheticEvent = {
          preventDefault: () => event.preventDefault(),
          clientX: event.clientX,
          clientY: event.clientY,
        } as React.MouseEvent
        continueDrawing(syntheticEvent)
      }
    }

    const handleMouseUp = () => {
      if (isDrawing) {
        endDrawing()
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (isDrawing && event.touches.length > 0) {
        const syntheticEvent = {
          preventDefault: () => event.preventDefault(),
          touches: event.touches,
        } as React.TouchEvent
        continueDrawing(syntheticEvent)
      }
    }

    const handleTouchEnd = () => {
      if (isDrawing) {
        endDrawing()
      }
    }

    if (isDrawing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDrawing, continueDrawing, endDrawing])

  return (
    <NodeViewWrapper className="canvas-drawing-wrapper">
      <div className="border rounded-lg p-4 bg-background">
        {/* Controles */}
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
              title="Color del trazo"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={randomizeColor}
              title="Color aleatorio"
            >
              🎲
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Grosor:</label>
            <Input
              type="range"
              min="1"
              max="20"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-xs text-muted-foreground w-6">{size}px</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={node.attrs.lines.length === 0}
              title="Limpiar canvas"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={exportSVG}
              disabled={node.attrs.lines.length === 0}
              title="Exportar SVG"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            {node.attrs.lines.length} trazo(s)
          </div>
        </div>

        {/* Canvas SVG */}
        <div className="relative border-2 border-dashed border-muted-foreground/20 rounded-lg overflow-hidden bg-white">
          <svg
            ref={canvasRef}
            viewBox="0 0 500 250"
            className="w-full h-64 cursor-crosshair touch-none canvas-drawing-svg"
            onMouseDown={startDrawing}
            onTouchStart={startDrawing}
            style={{ touchAction: 'none' }}
            data-canvas-id={`canvas-${node.attrs.lines.length}`}
          >
            {/* Grid pattern */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Líneas guardadas */}
            {node.attrs.lines.map((line: DrawingLine) => (
              <path
                key={line.id}
                d={line.path}
                stroke={line.color}
                strokeWidth={line.size}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Línea actual en proceso */}
            {isDrawing && currentPath && (
              <path
                d={currentPath}
                stroke={color}
                strokeWidth={size}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
            )}
          </svg>

          {/* Overlay de ayuda cuando está vacío */}
          {node.attrs.lines.length === 0 && !isDrawing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground">
                <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Haz clic y arrastra para dibujar</p>
                <p className="text-xs">Funciona con mouse y touch</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export default CanvasComponent
