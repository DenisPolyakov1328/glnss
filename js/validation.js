// Валидация и подсветка ячеек
export class TableValidator {
  static validateTableCells() {
    const invalidCells = []

    const validateTable = (tableId) => {
      const rows = document.querySelectorAll(`#${tableId} tbody tr`)
      rows.forEach((row, rowIndex) => {
        const xCell = row.cells[0]
        const yCell = row.cells[1]

        const xValue = xCell.textContent.trim()
        const yValue = yCell.textContent.trim()

        if (xValue === '' || isNaN(parseFloat(xValue))) {
          invalidCells.push({
            table: tableId,
            cell: xCell,
            row: rowIndex,
            type: 'X'
          })
        }

        if (yValue === '' || isNaN(parseFloat(yValue))) {
          invalidCells.push({
            table: tableId,
            cell: yCell,
            row: rowIndex,
            type: 'Y'
          })
        }
      })
    }

    validateTable('table1')
    validateTable('table2')

    return invalidCells
  }

  static highlightInvalidCells(invalidCells) {
    this.clearHighlights()

    invalidCells.forEach(({ cell }) => {
      cell.classList.add('invalid')
    })

    if (invalidCells.length > 0) {
      invalidCells[0].cell.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }

  static clearHighlights() {
    const allCells = document.querySelectorAll('.editable-cell')
    allCells.forEach((cell) => {
      cell.classList.remove('invalid')
    })
  }
}

// Валидация UI ячеек таблиц
export class CellValidator {
  static setupCellValidation(cell, isEditable = true) {
    let lastValidValue = cell.textContent

    cell.addEventListener('input', (e) => {
      const selection = window.getSelection()
      const range = selection.getRangeAt(0)
      const cursorPosition = range.startOffset

      let text = e.target.textContent
      const originalText = text

      text = NumberValidation.sanitizeInput(text)

      let cursorAdjustment = 0

      if (text.startsWith('0.') && !originalText.startsWith('0.')) {
        cursorAdjustment = 1
      }

      if (text.startsWith('-0.') && originalText.startsWith('-.')) {
        cursorAdjustment = 1
      }

      e.target.textContent = text

      if (cursorAdjustment > 0 && text.length > 0) {
        setTimeout(() => {
          const newRange = document.createRange()
          const textNode = e.target.firstChild
          if (textNode) {
            const newPosition = Math.min(
              cursorPosition + cursorAdjustment,
              textNode.length
            )
            newRange.setStart(textNode, newPosition)
            newRange.setEnd(textNode, newPosition)
            selection.removeAllRanges()
            selection.addRange(newRange)
          }
        }, 0)
      }

      const isValid = NumberValidation.isValidNumber(text)
      e.target.classList.toggle('invalid', !isValid)

      if (isValid) {
        lastValidValue = text
      }

      e.target.classList.remove('invalid')
    })

    cell.addEventListener('keydown', (e) => {
      if (
        !NumberValidation.canInputKey(
          e,
          e.target.textContent,
          window.getSelection().getRangeAt(0).startOffset
        )
      ) {
        e.preventDefault()
        return false
      }
      return true
    })

    cell.addEventListener('blur', (e) => {
      const text = e.target.textContent

      if (text === '') {
        e.target.classList.add('invalid')
      } else {
        e.target.classList.remove('invalid')
      }

      e.target.textContent = NumberValidation.formatOnBlur(text)
    })

    cell.addEventListener('focus', (e) => {
      e.target.classList.remove('invalid')
    })
  }
}

// Правила валидации чисел
export class NumberValidation {
  static sanitizeInput(text) {
    let sanitized = text.replace(/[^\d.\-]/g, '')

    const minusCount = (sanitized.match(/-/g) || []).length
    if (minusCount > 1) {
      sanitized = sanitized.replace(/-/g, '')
      if (sanitized.length > 0) {
        sanitized = '-' + sanitized
      }
    }

    const dots = sanitized.match(/\./g)
    if (dots && dots.length > 1) {
      const firstDotIndex = sanitized.indexOf('.')
      sanitized =
        sanitized.substring(0, firstDotIndex + 1) +
        sanitized.substring(firstDotIndex + 1).replace(/\./g, '')
    }

    if (sanitized.includes('-') && sanitized.indexOf('-') > 0) {
      sanitized = sanitized.replace(/-/g, '')
    }

    if (sanitized.startsWith('.')) {
      sanitized = '0' + sanitized
    }

    if (sanitized.startsWith('-.')) {
      sanitized = '-0.' + sanitized.substring(2)
    }

    return sanitized
  }

  static isValidNumber(text) {
    return text === '' || /^-?\d*\.?\d*$/.test(text)
  }

  static canInputKey(key, currentText, cursorPosition) {
    if ([8, 9, 13, 37, 38, 39, 40, 46].includes(key.keyCode)) {
      return true
    }

    if (key.ctrlKey || key.metaKey) {
      return true
    }

    if (!/[0-9.\-]/.test(key.key)) {
      return false
    }

    if (key.key === '.' && currentText.includes('.')) {
      return false
    }

    if (key.key === '-' && (currentText.includes('-') || cursorPosition > 0)) {
      return false
    }

    return true
  }

  static formatOnBlur(text) {
    if (text && !isNaN(parseFloat(text))) {
      return parseFloat(text).toString()
    }
    return text
  }
}
