let ROWS = 5
let COLUMNS = 10
const LETTER_CODE = 65

const tableEl = document.querySelector('#table')
const inputFormulaEl = document.querySelector('.input-formula')
const selectedCellEl = document.querySelector('#selected-cell')
const headTableEl = tableEl.querySelector('#table thead')
const bodyTableEl = tableEl.querySelector('#table tbody')
const range = (length) => Array.from({ length }, (_, i) => i)
const getColumn = (codeLetter) => String.fromCharCode(codeLetter)

let STATE = range(COLUMNS).map(() =>(
  range(ROWS).map(() => ({computedValue: '', value: ''}))
))

let selectedColumn = null
let selectedRow = null
const computeValue = (value, constants) =>{
  // if(typeof value === 'number') return value
  if(!value.startsWith('=')) return value
  const formula = value.slice(1)
  let computedValue
  try{
    computedValue = eval(`
      (()=>{
        ${constants}
        return ${formula}
        })()
    `)
  }catch(e){
    computedValue = 'ERROR'
  }
  return computedValue
}

const renderSpreadSheet = () =>{
  const headerHtml = `
    <tr>
      <th>
      </th>
      ${range(COLUMNS).map(i => `<th>${getColumn(LETTER_CODE + i)}<span class="resizer"></span></th>`).join('')}
    </tr>
    `
  headTableEl.innerHTML = headerHtml
  const bodyHtml = range(ROWS).map(row => {
    return `
      <tr>
        <td>${row + 1} <span class="resizer"></span></td>
        ${range(COLUMNS).map(column => `
            <td data-x="${column}" data-y="${row}">
              <span>${STATE[column][row].computedValue}</span>
              <input type="text" value="${STATE[column][row].value}">
              
            </td>
          `).join('')}
      </tr>
    `
  }).join('')
  bodyTableEl.innerHTML = bodyHtml
  
  //resize

  const resizers = document.querySelectorAll('.resizer')

  resizers.forEach(resizer => {
    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault()
      const element = e.target.closest('th') || e.target.closest('td')
      if (!element) return

      const isWidthResize = element.tagName === 'TH'
      const startCoordinate = isWidthResize ? e.clientX : e.clientY
      const startSize = isWidthResize ? element.offsetWidth : element.offsetHeight

      const resize = (e) => {
        const delta = (isWidthResize ? e.clientX : e.clientY) - startCoordinate
        const newSize = startSize + delta
        if (isWidthResize) {
          element.style.width = newSize + 'px'
        } else {
          element.style.height = newSize + 'px'
        }
      }

      const stopResize = () => {
        window.removeEventListener('mousemove', resize)
        window.removeEventListener('mouseup', stopResize)
      }

      window.addEventListener('mousemove', resize)
      window.addEventListener('mouseup', stopResize)
    })
  })
}

const generateCellsConstants = (cells) => {
  const regexString = /[A-Za-z]/
  return cells.map((rows, x) => {
    return rows.map((cell, y) =>{
      const letter = getColumn(LETTER_CODE + x)
      const cellId = `${letter}${y + 1}`
      let value
      if(regexString.test(cell.computedValue)){
        value = `'${cell.computedValue}'` || ''
      }else{
        value = `${cell.computedValue}` || 0
      }
      return `const ${cellId} = ${value}`
    }).join(';')
  }).join(';')
} 

const computeAllCells = (cells, constants) => {
  cells.forEach((rows, x) => {
    rows.forEach((cell, y) => {
      const computedValue = computeValue(cell.value, constants)
      cell.computedValue = computedValue
    })
  })
}

const updateCell = ({ x, y, value}) =>{
  const newState = structuredClone(STATE)
  const constants = generateCellsConstants(newState)
  newState[x][y].value = value
  newState[x][y].computedValue = computeValue(value, constants)

  computeAllCells(newState, generateCellsConstants(newState))
  
  STATE = newState
  
  renderSpreadSheet()
}

bodyTableEl.addEventListener('click', (e) =>{
  const td = e.target.closest('td')
  if(!td) return
  
  const { x, y } = td.dataset
  const input = td.querySelector('input')
  if(!input) return
  
  document.querySelectorAll('input.active').forEach(el => el.classList.remove('active'))
  const letter = getColumn(LETTER_CODE + Number(x))
  const position = `${letter}${ Number(y) + 1 }`
  selectedCellEl.textContent = position
  inputFormulaEl.value = input.value

  input.setSelectionRange(input.value.length, input.value.length)
  input.focus()
  input.classList.add('active')
  document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'))

  input.addEventListener('blur', () =>{
    if(input.value === STATE[x][y].value) return
    updateCell({ x, y, value: input.value})
  }, { once: true })
  
  input.addEventListener('keyup', (e) =>{
    inputFormulaEl.value = input.value
    if(e.key === 'Enter'){
      input.blur()
    }
  })
})

headTableEl.addEventListener('click', (e) =>{
  const th = e.target.closest('th')
  if(!th) return

  const x = [...th.parentNode.children].indexOf(th)
  if(x <= 0) return
  selectedRow = null
  selectedColumn = x - 1
  const letter = getColumn(LETTER_CODE + selectedColumn)
  selectedCellEl.textContent = letter
  document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'))
  th.classList.add('selected')
  document.querySelectorAll(`tr td:nth-child(${x + 1})`).forEach(el => el.classList.add('selected'))
})

bodyTableEl.addEventListener('click', (e) =>{
  const td = e.target.closest('td')
  if(!td) return

  const indexTd = [...td.parentNode.children].indexOf(td)
  if(indexTd !== 0) return
  selectedColumn = null
  const tr = td.closest('tr')
  selectedRow = [...tr.parentNode.children].indexOf(tr)
  selectedCellEl.textContent = selectedRow + 1
  document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'))
  tr.querySelectorAll('td').forEach(el =>el.classList.add('selected') ) 
})

document.addEventListener('keydown', (e) =>{
  if(e.key === 'Backspace' && selectedColumn !== null){
    range(ROWS).forEach(row => {
      updateCell({x: selectedColumn, y: row, value: ''})
    })
    selectedColumn = null
    renderSpreadSheet()
  }
  if(e.key === 'Backspace' && selectedRow !== null){
    range(ROWS).forEach(row => {
      updateCell({x: row, y: selectedRow, value: ''})
    })
    selectedRow = null
    renderSpreadSheet()
  }
})
inputFormulaEl.addEventListener('keyup', (e) =>{
  if(e.key === 'Enter'){
    inputFormulaEl.blur()
  }
})

inputFormulaEl.addEventListener('blur', () => {
  const inputActive = document.querySelector('input.active')
  if(!inputActive) return

  const td = inputActive.closest('td')
  const { x, y } = td.dataset
  if(inputActive.value == inputFormulaEl.value) return
  updateCell({ x, y, value:inputFormulaEl.value })
})

document.addEventListener('copy', (e) => {
  if(selectedColumn != null){
    const columnValues = []
    range(ROWS).forEach(row => {
      columnValues.push(STATE[selectedColumn][row].computedValue)
    })
    e.clipboardData.setData('text/plain', columnValues.join('\n'))
    e.preventDefault()
  }
  if(selectedRow != null){
    const rowsValues = []
    range(COLUMNS).forEach(column => {
      rowsValues.push(STATE[column][selectedRow].computedValue)
    })
    e.clipboardData.setData('text/plain', rowsValues.join(' '))
    e.preventDefault()
  }
})
renderSpreadSheet()
