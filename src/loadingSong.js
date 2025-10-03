import './loadingSong.css'

function loadingText() {
  return <div className='loadingTextContainer'>
    <div className='loadingText' />
  </div>
}

function loadingSong(key, cols) {
  return <tr key={key}>
    {Array.from({length: cols}, (_, i) => <td key={i}>{loadingText()}</td>)}
  </tr>
}

function loadingSongs(rows = 5, cols = 4) {
  return Array.from({ length: rows }, (_, i) => loadingSong(i, cols))
}

export { loadingSong, loadingSongs }