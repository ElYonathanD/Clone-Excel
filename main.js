let ROWS = 3
let COLUMNS = 5
const LETTER_CODE = 65

const tableEl = document.querySelector('#table')
const headTableEl = tableEl.querySelector('#table thead')
const bodyTableEl = tableEl.querySelector('#table tbody')

const range = (length) => Array.from({ length }, (_, i) => i)
const getColumn = (codeLetter) => String.fromCharCode(codeLetter)// todo: después de la z el AA AB...

let STATE = range(COLUMNS).map(() =>(
  range(ROWS).map((row) => ({computedValue: 0, value: 0}))
))

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
  return cells.map((rows, x) => {
    return rows.map((cell, y) =>{
      const letter = getColumn(LETTER_CODE + x)
      const cellId = `${letter}${y + 1}`
      return `const ${cellId} = ${cell.computedValue}`
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
  const span = td.querySelector('span')

  input.setSelectionRange(input.value.length, input.value.length)
  input.focus()
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
renderSpreadSheet()