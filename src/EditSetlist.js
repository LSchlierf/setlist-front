import './EditSetlist.css'

import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import storage from './storage'
import Header from './Header'
import { byName, byArtist, byLength, byCat } from './songSort'
import { downloadFile } from './util'
import { BlobProvider } from '@react-pdf/renderer'
import SetlistSimplePDF from './SetlistSimplePDF'
import SetlistDetailedPDF from './SetlistDetailedPDF'
import { loadingSongs } from './loadingSong'

const DEFAULT_REPERTOIRE = { categories: [], songs: [] }
const DEFAULT_SETLIST = { concert: 'new setlist', sets: [], encore: [], breaks: { len: 20, buffer: 5 }, startTime: '19:30', timeFixed: 'start' }

export default function EditSetlist() {
  let navigate = useNavigate()
  let { state } = useLocation()
  const { id, concert } = state

  const [fullRepertoire, setFullRepertoire] = useState()
  const [dialog, setDialog] = useState(<></>)
  const [endTime, setEndTime] = useState('')
  const [repertoireDragging, setRepertoireDragging] = useState(false)
  const [setlist, setSetlist] = useState()
  const [repertoire, setRepertoire] = useState()
  const [categories, setCategories] = useState({})
  const [lastSort, setLastSort] = useState({ func: sortByName, asc: true, cat: null })
  const [newSetSong, setNewSetSong] = useState()
  const [draggingID, setDraggingID] = useState('')
  const [draggingFrom, setDraggingFrom] = useState('')
  const [filterText, setFilterText] = useState('')

  function handleSocketInput(newSetlist) {
    if (newSetlist.id !== id) return;
    setSetlist(newSetlist.data)
    setEndTime(newSetlist.endTime)
  }

  useEffect(() => {
    storage.init().then(() => {
      storage.getRepertoire().then(r => {
        setFullRepertoire(r)
      })
      storage.getSetlist(id).then(s => {
        setSetlist(s)
        setEndTime(calculateEndTime(s.startTime, s.breaks, s.sets, s.encore))
      })
      storage.socket?.on('setlist', handleSocketInput)
    })
    return () => {
      storage.socket?.off('setlist', handleSocketInput)
    }
  }, [])

  useEffect(() => {
    setRepertoire({
      ...fullRepertoire,
      songs: fullRepertoire?.songs?.filter((s) => (setlist ? ([...setlist.sets.flat(), ...setlist.encore, newSetSong].find((t) => t?.id === s.id) === undefined) : false))
    })
    setlist && setlist.songs ? lastSort.func(lastSort.asc, lastSort.cat) : (() => { })()
  }, [fullRepertoire, JSON.stringify(setlist?.sets), JSON.stringify(setlist?.encore)])

  useEffect(() => {
    setCategories(fullRepertoire ? Object.fromEntries(fullRepertoire.categories.map((c) => [c.id, (c.show === undefined ? true : c.show)])) : {})
  }, [fullRepertoire])

  useEffect(() => {
    if (!draggingID) {
      revalidateTimes()
    }
  }, [JSON.stringify(setlist?.breaks), JSON.stringify(setlist?.sets), JSON.stringify(setlist?.encore)])

  function revalidateTimes() {
    if (setlist) {
      if (setlist.timeFixed == 'end') {
        endTimeUpdate()
      } else {
        startTimeUpdate()
      }
    }
  }

  function handleSetlistChange(updater) {
    setSetlist(updater)
    const newSetlist = updater(setlist)
    const newEndTime = newSetlist.timeFixed === 'start' ? calculateEndTime(newSetlist.startTime, newSetlist.breaks, newSetlist.sets, newSetlist.encore) : endTime
    storage.socket?.emit('setlist', { id: id, data: newSetlist, endTime: newEndTime })
  }

  function sortByName(asc) {
    setLastSort({ func: sortByName, asc: asc, cat: null })
    setRepertoire(r => ({
      ...r,
      songs: byName(r.songs, asc)
    }))
  }

  function sortByArtist(asc) {
    setLastSort({ func: sortByArtist, asc: asc, cat: null })
    setRepertoire(r => ({
      ...r,
      songs: byArtist(r.songs, asc)
    }))
  }

  function sortByLength(asc) {
    setLastSort({ func: sortByLength, asc: asc, cat: null })
    setRepertoire(r => ({
      ...r,
      songs: byLength(r.songs, asc)
    }))
  }

  function sortByCat(asc, cat) {
    setLastSort({ func: sortByCat, asc: asc, cat: cat })
    setRepertoire(r => ({
      ...r,
      songs: byCat(r.songs, asc, cat)
    }))
  }

  function catDisplay(song, cat) {
    switch (cat.type) {
      case 'string':
      case 'number':
        return song.properties?.[cat.id]
      case 'bool':
        return song.properties?.[cat.id] ? '✔' : '✗'
      case 'stringMultiple':
        return song.properties?.[cat.id]?.join(', ')
      default:
        return <></>
    }
  }

  function startDragging(from, id) {
    return (e) => {
      setDraggingFrom(from)
      setDraggingID(id)

      e.dataTransfer.setData('text/plain', 'dummy') // somehow required for safari

      const makeSongDragged = (id) => (song) => {
        if (song.id !== id) return song;

        return {
          ...song,
          dragged: true
        }
      }

      if ('repertoire' === from) {
        setRepertoire(r => ({
          ...r,
          songs: r.songs.map(makeSongDragged(id))
        }))
      }

      let newSets = [...setlist.sets]
      let newEncore = [...setlist.encore]

      if ('encore' === from) {
        newEncore = newEncore.map(makeSongDragged(id))
      }

      else if (from.startsWith('set-')) {
        const setIndex = Number(from.substring(4))
        newSets[setIndex] = newSets[setIndex].map(makeSongDragged(id))
      }

      setSetlist({
        ...setlist,
        sets: newSets,
        encore: newEncore
      })
    }
  }

  function dragOver(to) {
    return (e) => {
      e.preventDefault()

      const id = draggingID

      let song = {
        ...fullRepertoire.songs.filter(s => s.id === id)[0],
        dragged: true
      };

      let newIndex = 0

      let newEncore = [...setlist.encore]
      let newSets = [...setlist.sets]

      const elements = document.getElementsByClassName(to)

      // determine new pos
      for (let el of elements) {
        if (el.getBoundingClientRect().bottom > e.clientY) break;
        newIndex++;
      }

      // remove previous dummy song
      const removeActualSong = (array) => {
        return array.filter(s => s.id !== id)
      }

      newEncore = removeActualSong(newEncore)
      newSets = [...newSets.map(removeActualSong)]

      // add dummy song
      const addSong = (array) => {
        return [...array.slice(0, newIndex), song, ...array.slice(newIndex)]
      }

      if ('encore' === to) {
        newEncore = addSong(newEncore)
      }

      if ('newSet' === to) {
        setNewSetSong(song)
      } else {
        setNewSetSong()
      }

      if (to.startsWith('set-')) {
        const setIndex = Number(to.substring(4))
        newSets[setIndex] = addSong(newSets[setIndex])
      }

      setSetlist({
        ...setlist,
        sets: newSets,
        encore: newEncore
      })

    }
  }

  function dropSong(to) {
    return (e) => {
      e.preventDefault()
      const from = draggingFrom
      const id = draggingID

      setDraggingFrom('')
      setDraggingID('')

      const removeDraggedTag = song => {
        let newSong = song;
        delete newSong.dragged;
        return newSong;
      }

      if ('repertoire' === to) {
        if (to === from) return;

        let newSets = [...setlist.sets]
        let newEncore = [...setlist.encore]

        if ('encore' === from) {
          newEncore = newEncore.filter(s => s.id !== id)
        }

        if (from.startsWith('set-')) {
          let setIndex = Number(from.substring(4))
          newSets[setIndex] = newSets[setIndex].filter(s => s.id !== id)
        }

        handleSetlistChange(s => ({
          ...s,
          encore: newEncore,
          sets: newSets
        }))

      } else if ('newSet' === to) {

        setNewSetSong()
        handleSetlistChange(s => ({
          ...s,
          sets: [...s.sets, [removeDraggedTag(newSetSong)]]
        }))

      } else {

        handleSetlistChange(s => ({
          ...s,
          encore: s.encore.map(removeDraggedTag),
          sets: [...s.sets.map(set => set.map(removeDraggedTag))]
        }))

      }
    }
  }

  function songRow(set) {
    return (song) => {
      let backgroundColor = repertoire.color?.colors[song.properties[repertoire.color?.category]]
      return (
        <tr key={song.id} className={set + ' ' + song.id + (song.dragged ? ' dragged' : '')} style={{ backgroundColor: backgroundColor, color: backgroundColor ? 'black' : null }} draggable='true' onDragStart={startDragging(set, song.id)}>
          <td>
            {song.title}
          </td>
          <td>
            {song.artist}
          </td>
          <td>
            {Math.floor(song.length / 60)}m {song.length % 60}s
          </td>
          {repertoire?.categories.filter((c) => categories[c.id]).map((c) => <td key={c.id} style={{
            backgroundColor: c.type === 'bool' ? (song.properties[c.id] ? 'green' : 'red') : null
          }}>
            {catDisplay(song, c)}
          </td>)}
          <td>
            {song.notes}
          </td>
        </tr>
      )
    }
  }

  function setLength(set) {
    let sum = set.reduce((a, s) => a + s.length, 0)
    return Math.floor(sum / 3600) + 'h ' + (Math.floor(sum / 60) % 60) + 'm ' + (sum % 60) + 's'
  }

  function setLengthApprox(set) {
    let sum = set.reduce((a, s) => a + s.length, 0)
    return Math.ceil(sum / 60 / 5) * 5
  }

  function concertDurationMinutes(breaks, sets, encore) {
    let setLengths = [...sets, encore].map((set) => Math.ceil(set.reduce((a, s) => a + s.length, 0) / 60 / 5) * 5)
    let sum = (setLengths.reduce((a, s) => a + s, 0) * 60) + (breaks * 60)
    return Math.ceil(sum / 60)
  }

  function songTableHead() {
    return (<thead>
      <tr>
        <th>Title</th>
        <th>Artist</th>
        <th>Length</th>
        {repertoire?.categories?.filter((c) => categories[c.id]).map((c) =>
          <th key={c.id}>{c.title}</th>
        )}
        <th>Notes</th>
      </tr>
    </thead>)
  }

  function setDisplay(set, index) {
    return (
      <div key={'set-' + index} className='singleSet' onDragOver={dragOver('set-' + index)} onDrop={dropSong('set-' + index)}>
        <div className='singleSetHead'>
          Set {index + 1}
          <div className='button' onClick={() => {
            let newSets = [...setlist.sets.slice(0, index), ...setlist.sets.slice(index + 1)]
            handleSetlistChange(s => ({
              ...s,
              sets: newSets
            }))
          }}>
            ✘ Delete set
          </div>
        </div>
        <table>
          {songTableHead()}
          <tbody>
            {set.map(songRow('set-' + index))}
          </tbody>
        </table>
        <div className='singleSetFoot'>
          {set.length} Songs, ~{setLengthApprox(set)} min, {setLength(set)}
        </div>
      </div>
    )
  }

  function fauxSet() {
    return (
      <div className='singleSet'>
        <div className='singleSetHead'>
          Loading...
        </div>
        <table>
          {songTableHead()}
          <tbody>
            {loadingSongs(8, repertoire?.categories?.length + 4 || 4)}
          </tbody>
        </table>
        <div className='singleSetFoot' />
      </div>
    )
  }

  function startTimeInput(e) {
    setEndTime(calculateEndTime(e.target.value, setlist.breaks, setlist.sets, setlist.encore))
    handleSetlistChange(s => ({
      ...s,
      startTime: e.target.value,
      timeFixed: 'start'
    }))
  }

  function startTimeUpdate() {
    setEndTime(getEndTime())
  }

  function endTimeInput(e) {
    const endH = Number(e.target.value.split(':')[0])
    const endM = Number(e.target.value.split(':')[1])
    const minutes = concertDurationMinutes(((setlist.breaks?.len || 0) * (Math.max(setlist.sets?.length - 1, 0) || 0)) + ((setlist.breaks?.buffer || 0) * (setlist.sets?.length)), setlist.sets, setlist.encore)
    const startMinutes = ((((endH * 60) + endM) + 1440) - minutes) % 1440
    const startVal = ('0' + (Math.floor(startMinutes / 60))).slice(-2) + ':' + ('0' + (startMinutes % 60)).slice(-2)
    if (startVal !== setlist.startTime) {
      handleSetlistChange(s => ({
        ...s,
        startTime: startVal,
        timeFixed: 'end'
      }))
    }
  }

  function endTimeUpdate() {
    const endH = Number(endTime.split(':')[0])
    const endM = Number(endTime.split(':')[1])
    const minutes = concertDurationMinutes(((setlist.breaks?.len || 0) * (Math.max(setlist.sets?.length - 1, 0) || 0)) + ((setlist.breaks?.buffer || 0) * (setlist.sets?.length)), setlist.sets, setlist.encore)
    const startMinutes = ((((endH * 60) + endM) + 1440) - minutes) % 1440
    const startVal = ('0' + (Math.floor(startMinutes / 60))).slice(-2) + ':' + ('0' + (startMinutes % 60)).slice(-2)
    if (startVal !== setlist.startTime) {
      handleSetlistChange(s => ({
        ...s,
        startTime: startVal,
        timeFixed: 'end'
      }))
    }
  }

  function calculateEndTime(startTime, breaks, sets, encore) {
    const startH = Number(startTime.split(':')[0])
    const startM = Number(startTime.split(':')[1])
    const minutes = concertDurationMinutes(((breaks?.len || 0) * (Math.max(sets?.length - 1, 0) || 0)) + ((breaks?.buffer || 0) * (sets?.length)), sets, encore)
    const endMinutes = ((startH * 60) + startM + minutes) % 1440
    return ('0' + (Math.floor(endMinutes / 60))).slice(-2) + ':' + ('0' + (endMinutes % 60)).slice(-2)
  }

  function getEndTime() {
    return calculateEndTime(setlist.startTime || '19:30', setlist.breaks, setlist.sets, setlist.encore)
  }

  let leftButton = (
    <div onClick={() => navigate('/')} className='button'>
      Back
    </div>
  )

  function trackRepertoireSizeMove(e) {
    if (!repertoireDragging) return
    let newWidth = window.innerWidth - e.clientX + 4
    const bank = document.getElementById('repertoireBank')
    bank.style.width = newWidth + 'px'
  }

  function setlistBank() {
    return (
      <div className='setlistBank'>
        <input id='concertTitle' type='text' value={setlist?.concert || concert} onInput={() => {
          const input = document.getElementById('concertTitle')
          handleSetlistChange(s => ({
            ...s,
            concert: input.value
          }))
          storage.socket.emit('setlists')
        }} />

        {setlist?.sets && repertoire?.categories ? setlist.sets.map(setDisplay) : fauxSet()}

        <div className='singleSet newSet' onDragOver={dragOver('newSet')} onDrop={dropSong('newSet')}>
          <div className='newSetHead'>
            + Drag a song here to add a set
          </div>
          {newSetSong ?
            <table>
              {songTableHead()}
              <tbody>
                {songRow('newSet')(newSetSong)}
              </tbody>
            </table>
            : <></>}
        </div>

        <div className='singleSet' onDragOver={dragOver('encore')} onDrop={dropSong('encore')}>
          <div className='singleSetHead'>
            Encore
          </div>
          <table>
            {songTableHead()}
            <tbody>
              {setlist?.encore && repertoire?.categories ? setlist.encore.map(songRow('encore')) : loadingSongs(3, repertoire?.categories?.length + 4 || 4)}
            </tbody>
          </table>
          <div className='singleSetFoot'>
            {setlist?.encore.length || 0} Songs, ~{setlist ? setLengthApprox(setlist.encore) : 0} min, {setlist ? setLength(setlist.encore) : "0m"}
          </div>
        </div>

        <div className='info'>
          Total songs: {setlist ? [...setlist.encore, ...setlist.sets.flat()].length : 0}
          <br />
          Raw length (without breaks / buffer): <b><u>{setlist ? setLength([...setlist.encore, ...setlist.sets.flat()]) : "0m"}</u></b>
          <br />
          <input id='breaksLen' type='number' value={setlist?.breaks?.len} min={0} max={60} style={{ width: 50 }} onInput={() => {
            const input = document.getElementById('breaksLen')
            handleSetlistChange(s => ({
              ...s,
              breaks: {
                ...s.breaks,
                len: Number(input.value)
              }
            }))
          }} /> minute break after each set (except last set)
          <br />
          <input id='breaksBuffer' type='number' value={setlist?.breaks?.buffer} min={0} max={60} style={{ width: 50 }} onInput={() => {
            const input = document.getElementById('breaksBuffer')
            handleSetlistChange(s => ({
              ...s,
              breaks: {
                ...s.breaks,
                buffer: Number(input.value)
              }
            }))
          }} /> minute buffer per set
          <br />
          Total length (with breaks & buffer): <b><u>{
            function () {
              if (!setlist) return "0m"
              let length = concertDurationMinutes(((setlist.breaks?.len || 0) * (Math.max(setlist.sets?.length - 1, 0) || 0)) + ((setlist.breaks?.buffer || 0) * (setlist.sets?.length)), setlist.sets, setlist.encore)
              return Math.floor(length / 60) + 'h ' + (length % 60) + 'm'
            }()
          }</u></b>
          <br />
          Start time: <input value={setlist?.startTime || '19:30'} id='startTime' type='time' onChange={e => setSetlist(s => ({ ...s, startTime: e.target.value }))} onBlur={startTimeInput} />,
          End time: <input id='endTime' type='time' onChange={e => setEndTime(e.target.value)} onBlur={endTimeInput} value={endTime} />
        </div>

        <div className='info'>
          Select categories to display:
          <br />
          {repertoire?.categories?.map((c) => (
            <div>
              <input checked={categories[c.id]} id={'selectShowCat-' + c.id} type='checkbox' onChange={(e) => {
                const input = e.target
                let newCategories = { ...categories }
                newCategories[c.id] = input.checked
                setCategories(newCategories)
              }} /> {c.title}
            </div>
          ))}
        </div>

        {setlist?.sets && repertoire?.songs ? <div className='button' onClick={() => {
          setDialog(
            <dialog open id='dialog'>
              <u>Export setlist</u>
              <br />
              Export to JSON file:
              <button type='button' onClick={() => {
                downloadFile({
                  data: JSON.stringify(setlist, null, 2),
                  fileName: 'Setlist ' + setlist.concert + '.json',
                  fileType: 'text/json'
                })
                setDialog(<></>)
              }}>
                Download JSON
              </button>
              <br />
              Simple setlist to PDF file:
              <BlobProvider document={<SetlistSimplePDF setlist={setlist} />} >
                {({ blob, url, loading, error }) => (
                  loading ? 'loading...' : <a href={url} target='_blank' rel='noopen noreferrer' >Download</a>
                )}
              </BlobProvider>
              <br />
              Detailed setlist to PDF file:
              <div>
                <form>
                  {repertoire.categories.map((c) =>
                    <>
                      <input key={c.id + '-checkbox'} className={'detailedPDFselect'} type='checkbox' name={c.id + '-detailedPDFselect'} value={c.id} defaultChecked={true} />
                      <label key={c.id + '-label'} htmlFor={c.id + '-detailedPDFselect'}>{c.title}</label>
                      <br />
                    </>
                  )}
                </form>
                <br />
                <div className='dialogAction'>
                  <button type='button' onClick={() => {
                    let inputList = document.getElementsByClassName('detailedPDFselect')
                    let selected = {}
                    for (let item of inputList) {
                      selected[item.value] = item.checked
                    }
                    setDialog(
                      <dialog open id='dialog'>
                        <u>Download detailed setlist PDF</u>
                        <br />
                        <BlobProvider document={<SetlistDetailedPDF setlist={setlist} repertoire={
                          {
                            ...repertoire,
                            categories: repertoire.categories.filter((c) => selected[c.id])
                          }
                        } />} >
                          {({ blob, url, loading, error }) => (
                            loading ? 'loading...' : <a href={url} target='_blank' rel='noopen noreferrer'>Download</a>
                          )}
                        </BlobProvider>
                        <div className='dialogAction'>
                          <button type='button' onClick={() => setDialog(<></>)} >Close</button>
                        </div>
                      </dialog>
                    )
                  }}>
                    Generate PDF
                  </button>
                </div>
              </div>
              <br />
              <div className='dialogAction'>
                <button type='button' onClick={() => {
                  setDialog(<></>)
                }}>
                  Close
                </button>
              </div>
            </dialog>
          )
        }} >
          Export setlist
        </div> : <></>}

        <div className='debug'>
          {/* {JSON.stringify(categories)} */}
          {/* {JSON.stringify(setlist)} */}
          {/* {JSON.stringify(repertoire)} */}
        </div>
      </div>
    )
  }

  function filterSong(s) {
    return s.title.toLowerCase().includes(filterText.toLowerCase()) ||
      s.artist.toLowerCase().includes(filterText.toLowerCase()) ||
      s.notes?.toLowerCase().includes(filterText.toLowerCase())
  }

  function repertoireBank() {
    return (
      <div id='repertoireBank' className='repertoireBank' onDragOver={dragOver('repertoire')} onDrop={dropSong('repertoire')}>
        <div className='repertoireBankVert' onMouseDown={(e) => {
          e.preventDefault()
          setRepertoireDragging(true)
        }} onPointerDown={(e) => {
          e.preventDefault()
          setRepertoireDragging(true)
        }} >
          <div className='repertoireBankVertDot' />
          <div className='repertoireBankVertDot' />
          <div className='repertoireBankVertDot' />
        </div>
        <div className='repertoireTableCointainer'>
          <div className='filterOption'>
            Filter:
            <input type='text' value={filterText} onInput={e => setFilterText(e.target.value)} />
            <span className='button' onClick={() => setFilterText('')}>Clear</span>
          </div>
          <table>
            <thead className='repertoireTableHeader'>
              <tr>
                <th>
                  <div className='repCategory' >
                    Song title
                    <div className='categoryAction'>
                      <div className='button' onClick={() => sortByName(true)}>˄</div>
                      <div className='button' onClick={() => sortByName(false)}>˅</div>
                    </div>
                  </div>
                </th>
                <th>
                  <div className='repCategory'>
                    Artist
                    <div className='categoryAction'>
                      <div className='button' onClick={() => sortByArtist(true)}>˄</div>
                      <div className='button' onClick={() => sortByArtist(false)}>˅</div>
                    </div>
                  </div>
                </th>
                <th>
                  <div className='repCategory'>
                    Length
                    <div className='categoryAction'>
                      <div className='button' onClick={() => sortByLength(true)}>˄</div>
                      <div className='button' onClick={() => sortByLength(false)}>˅</div>
                    </div>
                  </div>
                </th>
                {repertoire?.categories?.filter((c) => categories[c.id]).map((c) => <th key={c.id}>
                  <div className='repCategory'>
                    {c.title}
                    <div className='categoryAction'>
                      <div className='button' onClick={() => sortByCat(true, c)}>˄</div>
                      <div className='button' onClick={() => sortByCat(false, c)}>˅</div>
                    </div>
                  </div>
                </th>)}
                <th>
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {repertoire?.songs && setlist ? repertoire.songs.filter(filterSong).map(songRow('repertoire')) : loadingSongs(5, repertoire?.categories?.length + 4 || 4)}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className='pageContainer' onMouseMove={trackRepertoireSizeMove} onPointerMove={trackRepertoireSizeMove} onMouseUp={() => {
      setRepertoireDragging(false)
    }} onPointerUp={() => {
      setRepertoireDragging(false)
    }} >
      <Header title='Edit setlist' leftButton={leftButton} />

      {dialog}

      {setlistBank()}

      {repertoireBank()}
    </div >
  )
}
