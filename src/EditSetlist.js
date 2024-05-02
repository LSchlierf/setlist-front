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

export default function EditSetlist() {
  let fullRepertoire = storage.getRepertoire()
  const [dialog, setDialog] = useState(<></>)
  const [lastTime, setLastTime] = useState('start')

  function updateSetlist(setlist) {
    return {
      ...setlist,
      sets: setlist.sets.map((set) => set.map((song) => fullRepertoire.songs.find((s) => s.id === song.id))),
      encore: setlist.encore.map((song) => fullRepertoire.songs.find((s) => s.id === song.id))
    }
  }

  let { state } = useLocation()
  let navigate = useNavigate()
  const id = state
  const [setlist, setSetlist] = useState(storage.updateSetlist(id, updateSetlist(storage.getSetlist(id))))
  const [repertoire, setRepertoire] = useState({
    ...fullRepertoire,
    songs: fullRepertoire.songs.filter((s) => ([...setlist.sets.flat(), ...setlist.encore].find((t) => t?.id === s.id) === undefined))
  })
  const [categories, setCategories] = useState(Object.fromEntries(fullRepertoire.categories.map((c) => [c.id, true])))
  const [lastSort, setLastSort] = useState({ func: sortByName, asc: true, cat: null })

  useEffect(() => {
    if (lastTime === 'start') {
      startTimeInput()
    } else {
      endTimeInput()
    }
  }, [setlist])

  let leftButton = (
    <div onClick={() => navigate('/')} className='button'>
      Back
    </div>
  )

  function sortByName(asc, rep) {
    setLastSort({ func: sortByName, asc: asc, cat: null })
    setRepertoire({
      ...rep,
      songs: byName(rep.songs, asc)
    })
  }

  function sortByArtist(asc, rep) {
    setLastSort({ func: sortByArtist, asc: asc, cat: null })
    setRepertoire({
      ...rep,
      songs: byArtist(rep.songs, asc)
    })
  }

  function sortByLength(asc, rep) {
    setLastSort({ func: sortByLength, asc: asc, cat: null })
    setRepertoire({
      ...rep,
      songs: byLength(rep.songs, asc)
    })
  }

  function sortByCat(asc, rep, cat) {
    setLastSort({ func: sortByCat, asc: asc, cat: cat })
    setRepertoire({
      ...rep,
      songs: byCat(rep.songs, asc, cat)
    })
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

  function songRow(from) {
    return (song) => {
      let backgroundColor = repertoire.color?.colors[song.properties[repertoire.color?.category]]
      return (
        <tr key={song.id} className={from + ' ' + song.id} style={{ backgroundColor: backgroundColor, color: backgroundColor ? 'black' : null }} draggable='true' onDragStart={(e) => { e.dataTransfer.setData('id', song.id); e.dataTransfer.setData('from', from) }}>
          <td>
            {song.title}
          </td>
          <td>
            {song.artist}
          </td>
          <td>
            {Math.floor(song.length / 60)}m {song.length % 60}s
          </td>
          {repertoire.categories.filter((c) => categories[c.id]).map((c) => <td key={c.id} style={{
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

  function concertDurationMinutes(breaks) {
    let setLengths = [...setlist.sets, setlist.encore].map((set) => Math.ceil(set.reduce((a, s) => a + s.length, 0) / 60 / 5) * 5)
    let sum = (setLengths.reduce((a, s) => a + s, 0) * 60) + (breaks * 60)
    return Math.ceil(sum / 60)
  }

  function setDisplay(set, index) {
    return (
      <div key={index} className='singleSet' onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
        let songID = e.dataTransfer.getData('id')
        let from = e.dataTransfer.getData('from')
        let newSets = setlist.sets
        let song = fullRepertoire.songs.find((s) => s.id === songID)
        let newEncore = setlist.encore
        if (from === 'repertoire') {
          setRepertoire({
            ...repertoire,
            songs: repertoire.songs.filter((s) => s.id !== songID)
          })
        } else if (from.startsWith('set-')) {
          let setIndex = Number(from.substring(4))
          newSets = [...newSets.slice(0, setIndex), newSets[setIndex].filter((s) => s.id !== songID), ...newSets.slice(setIndex + 1)]
        } else if (from === 'encore') {
          newEncore = newEncore.filter((s) => s.id !== songID)
        }
        let newSet = set.filter((s) => s.id !== songID)
        let y = e.clientY
        let songs = document.getElementsByClassName('set-' + index)
        if (songs.length === 0 || y < songs[0].getBoundingClientRect().top) {
          newSets = [...newSets.slice(0, index), [song, ...newSet], ...newSets.slice(index + 1)]
        } else if (y > songs[songs.length - 1].getBoundingClientRect().bottom) {
          newSets = [...newSets.slice(0, index), [...newSet, song], ...newSets.slice(index + 1)]
        } else {
          for (let i = 0; i < songs.length; i++) {
            let top = songs[i].getBoundingClientRect().top
            let bottom = songs[i].getBoundingClientRect().bottom
            if (y >= top && y <= bottom) {
              if (y - top < bottom - y) {
                newSets = [...newSets.slice(0, index), [...newSet.slice(0, i), song, ...newSet.slice(i)], ...newSets.slice(index + 1)]
              } else {
                newSets = [...newSets.slice(0, index), [...newSet.slice(0, i + 1), song, ...newSet.slice(i + 1)], ...newSets.slice(index + 1)]
              }
            }
          }
        }
        setSetlist(storage.updateSetlist(id, {
          ...setlist,
          sets: newSets,
          encore: newEncore
        }))
      }}>
        <div className='singleSetHead'>
          Set {index + 1}
          <div className='button' onClick={() => {
            let newSets = [...setlist.sets.slice(0, index), ...setlist.sets.slice(index + 1)]
            let newRep = {
              ...repertoire,
              songs: [...repertoire.songs, ...set]
            }
            setSetlist(storage.updateSetlist(id, {
              ...setlist,
              sets: newSets
            }))
            lastSort.func(lastSort.asc, newRep, lastSort.cat)
          }}>
            ✘ Delete set
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>
                Title
              </th>
              <th>
                Artist
              </th>
              <th>
                Length
              </th>
              {repertoire.categories.filter((c) => categories[c.id]).map((c) =>
                <th key={c.id}>
                  {c.title}
                </th>
              )}
              <th>
                Notes
              </th>
            </tr>
          </thead>
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

  function startTimeInput() {
    const start = document.getElementById('startTime')
    const startH = Number(start.value.split(':')[0])
    const startM = Number(start.value.split(':')[1])
    const end = document.getElementById('endTime')
    const minutes = concertDurationMinutes(((setlist.breaks?.len || 0) * (Math.max(setlist.sets?.length - 1, 0) || 0)) + ((setlist.breaks?.buffer || 0) * (setlist.sets?.length)))
    const endMinutes = ((startH * 60) + startM + minutes) % 1440
    setSetlist(storage.updateSetlist(id, {
      ...setlist,
      startTime: start.value
    }))
    end.value = ('0' + (Math.floor(endMinutes / 60))).slice(-2) + ':' + ('0' + (endMinutes % 60)).slice(-2)
    setLastTime('start')
  }

  function endTimeInput() {
    const start = document.getElementById('startTime')
    const end = document.getElementById('endTime')
    const endH = Number(end.value.split(':')[0])
    const endM = Number(end.value.split(':')[1])
    const minutes = concertDurationMinutes(((setlist.breaks?.len || 0) * (Math.max(setlist.sets?.length - 1, 0) || 0)) + ((setlist.breaks?.buffer || 0) * (setlist.sets?.length)))
    const startMinutes = ((((endH * 60) + endM) + 1440) - minutes) % 1440
    const startVal = ('0' + (Math.floor(startMinutes / 60))).slice(-2) + ':' + ('0' + (startMinutes % 60)).slice(-2)
    setSetlist(storage.updateSetlist(id, {
      ...setlist,
      startTime: startVal
    }))
    start.value = startVal
    setLastTime('end')
  }

  return (
    <div className='pageContainer'>
      <Header title='Edit setlist' leftButton={leftButton} />
      {dialog}
      <div className='setlistBank'>
        <input id='concertTitle' type='text' defaultValue={setlist.concert} onInput={() => {
          const input = document.getElementById('concertTitle')
          setSetlist(storage.updateSetlist(id, {
            ...setlist,
            concert: input.value
          }))
        }} />
        {setlist.sets.map(setDisplay)}
        <div className='newSet' onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
          const songID = e.dataTransfer.getData('id')
          const from = e.dataTransfer.getData('from')
          const song = fullRepertoire.songs.find((s) => s.id === songID)
          if (from === 'repertoire') {
            setRepertoire({
              ...repertoire,
              songs: repertoire.songs.filter((s) => s.id !== songID)
            })
            setSetlist(storage.updateSetlist(id, {
              ...setlist,
              sets: [...setlist.sets, [song]]
            }))
          } else if (from.startsWith('set-')) {
            let set = Number(from.substring(4))
            setSetlist(storage.updateSetlist(id, {
              ...setlist,
              sets: [...setlist.sets.slice(0, set), setlist.sets[set].filter((s) => s.id !== songID), ...setlist.sets.slice(set + 1), [song]]
            }))
          }
        }}>
          + Drag a song here to add a set
        </div>
        <div className='singleSet' onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
          e.preventDefault()
          const songID = e.dataTransfer.getData('id')
          const from = e.dataTransfer.getData('from')
          const song = fullRepertoire.songs.find((s) => s.id === songID)
          let newEncore = setlist.encore
          if (from === 'encore') { // moving song within encore
            const songs = document.getElementsByClassName('encore')
            const y = e.clientY
            if (songs.length === 0 || y < songs[0].getBoundingClientRect().top) {
              newEncore = [song, ...newEncore.filter((s) => s.id !== songID)]
            } else if (y > songs[songs.length - 1].getBoundingClientRect().bottom) {
              newEncore = [...newEncore.filter((s) => s.id !== songID), song]
            } else {
              for (let i = 0; i < songs.length; i++) {
                let top = songs[i].getBoundingClientRect().top
                let bottom = songs[i].getBoundingClientRect().bottom
                if (songs[i].classList.contains(songID)) {
                  continue
                }
                if (y >= top && y <= bottom) {
                  newEncore = newEncore.filter((s) => s.id !== songID)
                  if (y - top < bottom - y) {
                    newEncore = [...newEncore.slice(0, i), song, ...newEncore.slice(i)]
                  } else {
                    newEncore = [...newEncore.slice(0, i + 1), song, ...newEncore.slice(i + 1)]
                  }
                  break
                }
              }
            }
            setSetlist(storage.updateSetlist(id, {
              ...setlist,
              encore: newEncore
            }))
            return
          }
          let newSets = setlist.sets
          if (from === 'repertoire') {
            setRepertoire({
              ...repertoire,
              songs: repertoire.songs.filter((s) => s.id !== songID)
            })
          } else if (from.startsWith('set-')) {
            const setIndex = Number(from.substring(4))
            newSets = [...newSets.slice(0, setIndex), newSets[setIndex].filter((s) => s.id !== songID), ...newSets.slice(setIndex + 1)]
          }
          const songs = document.getElementsByClassName('encore')
          const y = e.clientY
          if (songs.length === 0 || y < songs[0].getBoundingClientRect().top) {
            newEncore = [song, ...newEncore]
          } else if (y > songs[songs.length - 1].getBoundingClientRect().bottom) {
            newEncore = [...newEncore, song]
          } else {
            for (let i = 0; i < songs.length; i++) {
              let top = songs[i].getBoundingClientRect().top
              let bottom = songs[i].getBoundingClientRect().bottom
              if (y >= top && y <= bottom) {
                if (y - top < bottom - y) {
                  newEncore = [...newEncore.slice(0, i), song, ...newEncore.slice(i)]
                } else {
                  newEncore = [...newEncore.slice(0, i + 1), song, ...newEncore.slice(i + 1)]
                }
                break
              }
            }
          }
          setSetlist(storage.updateSetlist(id, {
            ...setlist,
            sets: newSets,
            encore: newEncore
          }))
        }}>
          <div className='singleSetHead'>
            Encore
          </div>
          <table>
            <thead>
              <tr>
                <th>
                  Title
                </th>
                <th>
                  Artist
                </th>
                <th>
                  Length
                </th>
                {repertoire.categories.filter((c) => categories[c.id]).map((c) =>
                  <th key={c.id}>
                    {c.title}
                  </th>
                )}
                <th>
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {setlist.encore.map(songRow('encore'))}
            </tbody>
          </table>
          <div className='singleSetFoot'>
            {setlist.encore.length} Songs, ~{setLengthApprox(setlist.encore)} min, {setLength(setlist.encore)}
          </div>
        </div>
        <div className='info'>
          Total songs: {[...setlist.encore, ...setlist.sets.flat()].length}
          <br />
          Raw length (without breaks / buffer): <b><u>{setLength([...setlist.encore, ...setlist.sets.flat()])}</u></b>
          <br />
          <input id='breaksLen' type='number' defaultValue={setlist.breaks?.len} min={0} max={60} style={{ width: 50 }} onInput={() => {
            const input = document.getElementById('breaksLen')
            setSetlist(storage.updateSetlist(id, {
              ...setlist,
              breaks: {
                ...setlist.breaks,
                len: Number(input.value)
              }
            }))
          }} /> minute break after each set (except last set)
          <br />
          <input id='breaksBuffer' type='number' defaultValue={setlist.breaks?.buffer} min={0} max={60} style={{ width: 50 }} onInput={() => {
            const input = document.getElementById('breaksBuffer')
            setSetlist(storage.updateSetlist(id, {
              ...setlist,
              breaks: {
                ...setlist.breaks,
                buffer: Number(input.value)
              }
            }))
          }} /> minute buffer per set
          <br />
          Total length (with breaks & buffer): <b><u>{
            function () {
              let length = concertDurationMinutes(((setlist.breaks?.len || 0) * (Math.max(setlist.sets?.length - 1, 0) || 0)) + ((setlist.breaks?.buffer || 0) * (setlist.sets?.length)))
              return Math.floor(length / 60) + 'h ' + (length % 60) + 'm'
            }()
          }</u></b>
          <br />
          Start time: <input defaultValue={setlist.startTime || '19:30'} id='startTime' type='time' onInput={startTimeInput} />,
          End time: <input id='endTime' type='time' onInput={endTimeInput} defaultValue={
            function () {
              const startTime = setlist.startTime || '19:30'
              const startH = Number(startTime.split(':')[0])
              const startM = Number(startTime.split(':')[1])
              const minutes = concertDurationMinutes(((setlist.breaks?.len || 0) * (Math.max(setlist.sets?.length - 1, 0) || 0)) + ((setlist.breaks?.buffer || 0) * (setlist.sets?.length)))
              const endMinutes = ((startH * 60) + startM + minutes) % 1440
              return ('0' + (Math.floor(endMinutes / 60))).slice(-2) + ':' + ('0' + (endMinutes % 60)).slice(-2)
            }()
          } />
        </div>
        <div className='info'>
          Select categories to display:
          <br />
          {repertoire.categories.map((c) => (
            <div>
              <input defaultChecked={categories[c.id]} id={'selectShowCat-' + c.id} type='checkbox' onInput={() => {
                const input = document.getElementById('selectShowCat-' + c.id)
                let newCategories = { ...categories }
                newCategories[c.id] = input.checked
                setCategories(newCategories)
              }} /> {c.title}
            </div>
          ))}
        </div>
        <div className='button' onClick={() => {
          setDialog(
            <dialog open id='dialog'>
              <u>Export setlist</u>
              <br />
              Export to JSON file:
              <button type='button' onClick={() => {
                downloadFile({
                  data: JSON.stringify(setlist, null, 2),
                  fileName: 'Setlist  ' + setlist.concert + '.json',
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
        </div>
        <div className='debug'>
          {/* {JSON.stringify(categories)} */}
          {/* {JSON.stringify(setlist)} */}
        </div>
      </div>
      <div className='repertoireBank' onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
        e.preventDefault()
        const songID = e.dataTransfer.getData('id')
        const from = e.dataTransfer.getData('from')
        if (from === 'repertoire') {
          return
        }
        if (from.startsWith('set-')) {
          const setIndex = Number(from.substring(4))
          setSetlist(storage.updateSetlist(id, {
            ...setlist,
            sets: [...setlist.sets.slice(0, setIndex), setlist.sets[setIndex].filter((s) => s.id !== songID), ...setlist.sets.slice(setIndex + 1)]
          }))
        } else if (from === 'encore') {
          setSetlist(storage.updateSetlist(id, {
            ...setlist,
            encore: setlist.encore.filter((s) => s.id !== songID)
          }))
        }
        lastSort.func(lastSort.asc, {
          ...repertoire,
          songs: [...repertoire.songs, fullRepertoire.songs.find((s) => s.id === songID)]
        }, lastSort.cat)
      }}>
        <table>
          <thead>
            <tr>
              <th>
                <div className='repCategory' >
                  Song title
                  <div className='categoryAction'>
                    <div className='button' onClick={() => sortByName(true, repertoire)}>˄</div>
                    <div className='button' onClick={() => sortByName(false, repertoire)}>˅</div>
                  </div>
                </div>
              </th>
              <th>
                <div className='repCategory'>
                  Artist
                  <div className='categoryAction'>
                    <div className='button' onClick={() => sortByArtist(true, repertoire)}>˄</div>
                    <div className='button' onClick={() => sortByArtist(false, repertoire)}>˅</div>
                  </div>
                </div>
              </th>
              <th>
                <div className='repCategory'>
                  Length
                  <div className='categoryAction'>
                    <div className='button' onClick={() => sortByLength(true, repertoire)}>˄</div>
                    <div className='button' onClick={() => sortByLength(false, repertoire)}>˅</div>
                  </div>
                </div>
              </th>
              {repertoire.categories.filter((c) => categories[c.id]).map((c) => <th key={c.id}>
                <div className='repCategory'>
                  {c.title}
                  <div className='categoryAction'>
                    <div className='button' onClick={() => sortByCat(true, repertoire, c)}>˄</div>
                    <div className='button' onClick={() => sortByCat(false, repertoire, c)}>˅</div>
                  </div>
                </div>
              </th>)}
              <th>
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {repertoire.songs.map(songRow('repertoire'))}
          </tbody>
        </table>
      </div>
    </div >
  )
}
