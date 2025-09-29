import { TableManager } from './table.js'
import { TableValidator } from './validation.js'
import { ChartRenderer } from './chart.js'

export class TableGraphApp {
  constructor() {
    this.tables = {
      table1: { rows: [] },
      table2: { rows: [] },
      table3: { rows: [] }
    }

    this.charts = {}
    this.chartsInitialized = false
  }

  init() {
    this.addInitialRows()
    this.setupEventListeners()

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initCharts())
    } else {
      this.initCharts()
    }
  }

  addInitialRows() {
    this.addRowToTable('table1')
    this.addRowToTable('table2')
  }

  addRowToTable(tableId, x = '', y = '') {
    const tableBody = document.querySelector(`#${tableId} tbody`)
    const newRow = document.createElement('tr')

    const cellX = TableManager.createValidatedCell(x, tableId !== 'table3')
    const cellY = TableManager.createValidatedCell(y, tableId !== 'table3')

    newRow.appendChild(cellX)
    newRow.appendChild(cellY)

    if (tableId !== 'table3') {
      const cellAction = document.createElement('td')
      const deleteBtn = document.createElement('button')
      deleteBtn.textContent = 'Delete'
      deleteBtn.className = 'btn btn--delete'
      deleteBtn.onclick = () => this.deleteRow(tableId, newRow)
      cellAction.appendChild(deleteBtn)
      newRow.appendChild(cellAction)
    }

    tableBody.appendChild(newRow)
  }

  deleteRow(tableId, rowElement) {
    if (TableManager.getTableRowCount(tableId) <= 1) {
      alert('Нельзя удалить последнюю строку!')
      return
    }
    rowElement.remove()
  }

  setupEventListeners() {
    document.getElementById('addRow1').addEventListener('click', () => {
      this.addRowToTable('table1')
    })

    document.getElementById('addRow2').addEventListener('click', () => {
      this.addRowToTable('table2')
    })

    document.getElementById('calculateBtn').addEventListener('click', () => {
      this.calculateResults()
    })
  }

  initCharts() {
    try {
      const canvas1 = document.getElementById('chart1')
      const canvas2 = document.getElementById('chart2')
      const canvas3 = document.getElementById('chart3')

      if (!canvas1 || !canvas2 || !canvas3) {
        console.error('Canvas элементы не найдены')
        return
      }

      this.charts = {
        chart1: new ChartRenderer('chart1'),
        chart2: new ChartRenderer('chart2'),
        chart3: new ChartRenderer('chart3')
      }
      this.chartsInitialized = true
      console.log('Графики инициализированы')
    } catch (error) {
      console.error('Ошибка при инициализации графиков:', error)
    }
  }

  calculateResults() {
    try {
      if (!this.chartsInitialized) {
        console.log('Графики не инициализированы, пытаемся инициализировать...')
        this.initCharts()

        if (!this.chartsInitialized) {
          alert('Графики еще не готовы. Попробуйте еще раз.')
          return
        }
      }

      const invalidCells = TableValidator.validateTableCells()

      if (invalidCells.length > 0) {
        TableValidator.highlightInvalidCells(invalidCells)
        alert('Заполните все ячейки в таблицах!')
        return
      }

      const data1 = TableManager.getTableData('table1')
      const data2 = TableManager.getTableData('table2')

      if (data1.length === 0 || data2.length === 0) {
        alert('Добавьте данные в обе таблицы!')
        return
      }

      const minRows = Math.min(data1.length, data2.length)
      const table3Body = document.querySelector('#table3 tbody')
      table3Body.innerHTML = ''

      const resultData = []
      for (let i = 0; i < minRows; i++) {
        const avgX = (data1[i].x + data2[i].x) / 2
        const avgY = (data1[i].y + data2[i].y) / 2
        resultData.push({ x: avgX, y: avgY })
        this.addRowToTable('table3', avgX.toFixed(2), avgY.toFixed(2))
      }

      this.drawCharts(data1, data2, resultData)
    } catch (error) {
      console.error('Ошибка при расчете:', error)
      alert('Произошла ошибка при расчете. Проверьте данные.')
    }
  }

  drawCharts(data1, data2, data3) {
    if (this.chartsInitialized) {
      this.charts.chart1.render(data1, '#ff0000')
      this.charts.chart2.render(data2, '#0000ff')
      this.charts.chart3.render(data3, '#00aa00')
    }
  }
}
