import { CellValidator } from './validation.js'

export class TableManager {
  static createValidatedCell(value, isEditable = true) {
    const cell = document.createElement('td')
    cell.contentEditable = isEditable
    cell.textContent = value
    cell.className = 'editable-cell'

    CellValidator.setupCellValidation(cell, isEditable)

    return cell
  }

  static getTableData(tableId) {
    const rows = []
    const tableBody = document.querySelector(`#${tableId} tbody`)

    for (let row of tableBody.children) {
      const xText = row.cells[0].textContent.trim()
      const yText = row.cells[1].textContent.trim()

      const x = parseFloat(xText)
      const y = parseFloat(yText)

      if (!isNaN(x) && !isNaN(y)) {
        rows.push({ x, y })
      }
    }

    return rows
  }

  static getTableRowCount(tableId) {
    const tableBody = document.querySelector(`#${tableId} tbody`)
    return tableBody.children.length
  }
}
