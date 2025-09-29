// Рендер графиков
export class ChartRenderer {
  constructor(canvasId) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) {
      throw new Error(`Canvas элемент с id "${canvasId}" не найден`)
    }

    this.canvas = canvas
    this.ctx = this.canvas.getContext('2d')
    this.padding = 50

    // Свойства для трансформаций
    this.scale = 1
    this.offsetX = 0
    this.offsetY = 0
    this.currentData = []
    this.currentColor = '#ff0000'

    // Свойства для перетаскивания
    this.isDragging = false
    this.lastMouseX = 0
    this.lastMouseY = 0

    this.setCanvasSize()
    this.setupInteractions()
  }

  setupInteractions() {
    // Зумирование колесиком мыши
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault()

      const zoomIntensity = 0.1
      const mouseX = e.offsetX
      const mouseY = e.offsetY

      const wheel = e.deltaY < 0 ? 1 : -1
      const zoom = Math.exp(wheel * zoomIntensity)

      const newScale = this.scale * zoom
      if (newScale < 0.1 || newScale > 10) return

      this.scale = newScale
      this.offsetX = mouseX - (mouseX - this.offsetX) * zoom
      this.offsetY = mouseY - (mouseY - this.offsetY) * zoom

      this.render(this.currentData, this.currentColor)
    })

    // Перетаскивание
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true
      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY
      this.canvas.style.cursor = 'grabbing'
    })

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return

      const deltaX = e.clientX - this.lastMouseX
      const deltaY = e.clientY - this.lastMouseY

      this.offsetX += deltaX
      this.offsetY += deltaY

      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY

      this.render(this.currentData, this.currentColor)
    })

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false
      this.canvas.style.cursor = 'grab'
    })

    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false
      this.canvas.style.cursor = 'default'
    })

    // Сброс двойным кликом
    this.canvas.addEventListener('dblclick', () => {
      this.resetView()
    })

    // Сброс горячей клавишей R и на русской раскладке К
    document.addEventListener('keydown', (e) => {
      if (
        (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        this.resetView()
      }
    })

    // Стиль курсора по умолчанию
    this.canvas.style.cursor = 'grab'
  }

  resetView() {
    this.scale = 1
    this.offsetX = 0
    this.offsetY = 0
    this.render(this.currentData, this.currentColor)
  }

  setCanvasSize() {
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = Math.max(rect.width, 300)
    this.canvas.height = Math.max(rect.height, 200)
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  drawAxes() {
    const width = this.canvas.width
    const height = this.canvas.height

    if (width < this.padding * 2 || height < this.padding * 2) return

    this.ctx.strokeStyle = '#000'
    this.ctx.lineWidth = 2 / this.scale

    this.ctx.beginPath()
    this.ctx.moveTo(this.padding, height - this.padding)
    this.ctx.lineTo(width - this.padding, height - this.padding)
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.moveTo(this.padding, this.padding)
    this.ctx.lineTo(this.padding, height - this.padding)
    this.ctx.stroke()

    this.ctx.fillStyle = '#000'
    this.ctx.font = `${14 / this.scale}px Arial`
    this.ctx.fillText('X', width - 20, height - this.padding + 20)
    this.ctx.fillText('Y', this.padding - 25, 20)
  }

  drawAxisTicksAndLabels(data) {
    if (!data || data.length === 0) return

    const validData = data.filter((point) => !isNaN(point.x) && !isNaN(point.y))
    if (validData.length === 0) return

    const width = this.canvas.width
    const height = this.canvas.height
    const graphWidth = width - this.padding * 2
    const graphHeight = height - this.padding * 2

    const xValues = validData.map((point) => point.x)
    const yValues = validData.map((point) => point.y)
    const xMin = Math.min(...xValues)
    const xMax = Math.max(...xValues)
    const yMin = Math.min(...yValues)
    const yMax = Math.max(...yValues)

    const xRange = xMax - xMin || 1
    const yRange = yMax - yMin || 1

    const effectiveXRange = xRange === 0 ? 2 : xRange
    const effectiveYRange = yRange === 0 ? 2 : yRange
    const effectiveXMin = xRange === 0 ? xMin - 1 : xMin
    const effectiveXMax = xRange === 0 ? xMax + 1 : xMax
    const effectiveYMin = yRange === 0 ? yMin - 1 : yMin
    const effectiveYMax = yRange === 0 ? yMax + 1 : yMax

    const xStep = this.calculateOptimalStep(effectiveXRange)
    const yStep = this.calculateOptimalStep(effectiveYRange)

    this.ctx.strokeStyle = '#000'
    this.ctx.lineWidth = 1 / this.scale
    this.ctx.fillStyle = '#000'
    this.ctx.font = `${10 / this.scale}px Arial`
    this.ctx.textAlign = 'center'

    for (let value = effectiveXMin; value <= effectiveXMax; value += xStep) {
      const x =
        this.padding + ((value - effectiveXMin) / effectiveXRange) * graphWidth

      this.ctx.beginPath()
      this.ctx.moveTo(x, height - this.padding - 5 / this.scale)
      this.ctx.lineTo(x, height - this.padding + 5 / this.scale)
      this.ctx.stroke()

      this.ctx.fillText(
        value.toFixed(1),
        x,
        height - this.padding + 20 / this.scale
      )
    }

    this.ctx.textAlign = 'right'

    for (let value = effectiveYMin; value <= effectiveYMax; value += yStep) {
      const y =
        height -
        this.padding -
        ((value - effectiveYMin) / effectiveYRange) * graphHeight

      this.ctx.beginPath()
      this.ctx.moveTo(this.padding - 5 / this.scale, y)
      this.ctx.lineTo(this.padding + 5 / this.scale, y)
      this.ctx.stroke()

      this.ctx.fillText(
        value.toFixed(1),
        this.padding - 10 / this.scale,
        y + 3 / this.scale
      )
    }
  }

  calculateOptimalStep(range) {
    const optimalTickCount = 5
    const roughStep = range / optimalTickCount
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))
    const step = Math.ceil(roughStep / magnitude) * magnitude
    return step
  }

  drawGrid() {
    const width = this.canvas.width - this.padding * 2
    const height = this.canvas.height - this.padding * 2

    if (width <= 0 || height <= 0) return

    this.ctx.strokeStyle = '#e0e0e0'
    this.ctx.lineWidth = 0.5 / this.scale

    for (let x = this.padding; x <= this.canvas.width - this.padding; x += 50) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, this.padding)
      this.ctx.lineTo(x, this.canvas.height - this.padding)
      this.ctx.stroke()
    }

    for (
      let y = this.padding;
      y <= this.canvas.height - this.padding;
      y += 50
    ) {
      this.ctx.beginPath()
      this.ctx.moveTo(this.padding, y)
      this.ctx.lineTo(this.canvas.width - this.padding, y)
      this.ctx.stroke()
    }
  }

  drawChart(data, color = '#ff0000') {
    if (!data || data.length === 0) {
      this.drawNoDataMessage()
      return
    }

    const validData = data.filter((point) => !isNaN(point.x) && !isNaN(point.y))

    if (validData.length === 0) {
      this.drawNoDataMessage()
      return
    }

    const width = this.canvas.width - this.padding * 2
    const height = this.canvas.height - this.padding * 2

    if (width <= 0 || height <= 0) return

    const xValues = validData.map((point) => point.x)
    const yValues = validData.map((point) => point.y)
    const xMin = Math.min(...xValues)
    const xMax = Math.max(...xValues)
    const yMin = Math.min(...yValues)
    const yMax = Math.max(...yValues)

    const xRange = xMax - xMin || 1
    const yRange = yMax - yMin || 1

    if (validData.length >= 2) {
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = 3 / this.scale
      this.ctx.beginPath()

      validData.forEach((point, index) => {
        const x = this.padding + ((point.x - xMin) / xRange) * width
        const y =
          this.canvas.height -
          this.padding -
          ((point.y - yMin) / yRange) * height

        if (index === 0) {
          this.ctx.moveTo(x, y)
        } else {
          this.ctx.lineTo(x, y)
        }
      })
      this.ctx.stroke()
    }

    validData.forEach((point) => {
      const x = this.padding + ((point.x - xMin) / xRange) * width
      const y =
        this.canvas.height - this.padding - ((point.y - yMin) / yRange) * height

      this.ctx.fillStyle = color
      this.ctx.beginPath()
      this.ctx.arc(x, y, 5 / this.scale, 0, Math.PI * 2)
      this.ctx.fill()

      this.ctx.strokeStyle = '#fff'
      this.ctx.lineWidth = 2 / this.scale
      this.ctx.stroke()
    })

    this.drawPointLabels(validData, xMin, xMax, yMin, yMax, color)
  }

  drawPointLabels(data, xMin, xMax, yMin, yMax, color) {
    const width = this.canvas.width - this.padding * 2
    const height = this.canvas.height - this.padding * 2
    const xRange = xMax - xMin || 1
    const yRange = yMax - yMin || 1

    this.ctx.fillStyle = color
    this.ctx.font = `${11 / this.scale}px Arial`
    this.ctx.textAlign = 'center'

    data.forEach((point, index) => {
      if (index === 0 || index === data.length - 1 || index % 2 === 0) {
        const x = this.padding + ((point.x - xMin) / xRange) * width
        const y =
          this.canvas.height -
          this.padding -
          ((point.y - yMin) / yRange) * height

        this.ctx.fillText(`(${point.x}, ${point.y})`, x, y - 10 / this.scale)
      }
    })
  }

  drawNoDataMessage() {
    this.ctx.fillStyle = '#999'
    this.ctx.font = `${16 / this.scale}px Arial`
    this.ctx.textAlign = 'center'
    this.ctx.fillText(
      'Нет данных для отображения',
      this.canvas.width / 2,
      this.canvas.height / 2
    )
  }

  render(data, color = '#ff0000') {
    this.setCanvasSize()
    this.clear()

    this.currentData = data
    this.currentColor = color

    this.ctx.save()
    this.ctx.translate(this.offsetX, this.offsetY)
    this.ctx.scale(this.scale, this.scale)

    this.drawGrid()
    this.drawAxes()
    this.drawAxisTicksAndLabels(data)
    this.drawChart(data, color)

    this.ctx.restore()
  }
}
