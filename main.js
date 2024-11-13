let ROWS = 2
let COLUMNS = 5

const range = (length) => Array.from({ length }, (_, i) => i)

const renderSpreadSheet = () =>{
  const tableEl = document.querySelector('#table')
  const headTableEl = document.querySelector('#table thead')
  const bodyTableEl = document.querySelector('#table tbody')

  const headerHtml = `
    <tr>
      <th>
      </th>
      ${range(COLUMNS).map(i => `<th>${i}</th>`).join('')}
    </tr>
    `
  headTableEl.innerHTML = headerHtml
  const bodyHtml = range(ROWS).map(row => {
    return `
      <tr>
        <td>${row + 1}</td>
        ${range(COLUMNS).map(column => `
            <td data-x="${column}" data-y="${row}">
              <span></span>
              <input type="text" value="">
            </td>
          `).join('')}
      </tr>
    `
  }).join('')
  bodyTableEl.innerHTML = bodyHtml
}

renderSpreadSheet()