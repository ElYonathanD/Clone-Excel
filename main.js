let ROWS = 3
let COLUMNS = 5
const LETTER_CODE = 65

const tableEl = document.querySelector('#table')
const headTableEl = tableEl.querySelector('#table thead')
const bodyTableEl = tableEl.querySelector('#table tbody')

const range = (length) => Array.from({ length }, (_, i) => i)
const getColumn = (codeLetter) => String.fromCharCode(codeLetter)// todo: después de la z el AA AB...

let STATE = range(COLUMNS).map(() =>(
  range(ROWS).map((row) => ({computedValue: '', value: ''}))
))

let selectedColumn
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
    computedValue = 'ERROR' + e
  }
  return computedValue
}

const renderSpreadSheet = () =>{
  const headerHtml = `
    <tr>
      <th>
      </th>
      ${range(COLUMNS).map(i => `<th>${getColumn(LETTER_CODE + i)}</th>`).join('')}
    </tr>
    `
  headTableEl.innerHTML = headerHtml
  const bodyHtml = range(ROWS).map(row => {
    return `
      <tr>
        <td>${row + 1}</td>
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
      const computedValue = computeValue(String(cell.value), constants)
      cell.computedValue = computedValue
    })
  });
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
  input.setSelectionRange(input.value.length, input.value.length)
  input.focus()
  document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'))
  input.addEventListener('blur', () =>{
    if(input.value === STATE[x][y].value) return

    updateCell({ x, y, value: input.value})
  }, { once: true })

  input.addEventListener('keydown', (e) =>{
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

  selectedColumn = x - 1
  document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'))
  th.classList.add('selected')
  document.querySelectorAll(`tr td:nth-child(${x + 1})`).forEach(el => el.classList.add('selected'))
})

document.addEventListener('keydown', (e) =>{
  if(e.key === 'Backspace' && selectedColumn !== null){
    range(ROWS).forEach(row => {
      updateCell({x: selectedColumn, y: row, value: ''})
    })
    selectedColumn = null
    renderSpreadSheet()
  }
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
})// todo rows
renderSpreadSheet()