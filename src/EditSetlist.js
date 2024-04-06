import './EditSetlist.css'

import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import storage from './storage'
import Header from './Header'
import { byName, byArtist, byLength, byCat } from './songSort'

export default function EditSetlist() {
  let { state } = useLocation()
  let navigate = useNavigate()
  const id = state
  const [setlist, setSetlist] = useState(storage.getSetlist(id))
  let fullRepertoire = storage.getRepertoire()
  const [repertoire, setRepertoire] = useState({
    ...fullRepertoire,
    songs: fullRepertoire.songs.filter((s) => ([...setlist.sets.flat(), ...setlist.encore].find((t) => t?.id === s.id) === undefined))
  })
  const [lastSort, setLastSort] = useState({ func: sortByName, asc: true, cat: null })

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
        return song.properties[cat.id]
      case 'bool':
        return song.properties[cat.id] ? '✔' : '✗'
      default:
        return <></>
    }
  }

  function songRow(from) {
    return (song) => {
      let backgroundColor = repertoire.color?.colors[song.properties[repertoire.color?.category]]
      return (
        <tr className={from + ' ' + song.id} style={{ backgroundColor: backgroundColor, color: backgroundColor ? 'black' : null }} draggable='true' onDragStart={(e) => { e.dataTransfer.setData('id', song.id); e.dataTransfer.setData('from', from) }}>
          <td>
            {song.title}
          </td>
          <td>
            {song.artist}
          </td>
          <td>
            {Math.floor(song.length / 60)}m {song.length % 60}s
          </td>
          {repertoire.categories.map((c) => <td style={{
            backgroundColor: c.type === 'bool' ? (song.properties[c.id] ? 'green' : 'red') : null
          }}>
            {catDisplay(song, c)}
          </td>)}
        </tr>
      )
    }
  }

  function setLength(set) {
    let sum = set.reduce((a, s) => a + s.length, 0)
    return Math.floor(sum / 60) + 'm ' + (sum % 60) + 's'
  }

  function setDisplay(set, index) {
    return (
      <div className='singleSet' onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
        let songID = e.dataTransfer.getData('id')
        let from = e.dataTransfer.getData('from')
        let newSets = setlist.sets
        let song = fullRepertoire.songs.find((s) => s.id === songID)
        if (from === 'repertoire') {
          setRepertoire({
            ...repertoire,
            songs: repertoire.songs.filter((s) => s.id !== songID)
          })
        } else if (from.startsWith('set-')) {
          let setIndex = Number(from.substring(4))
          newSets = [...newSets.slice(0, setIndex), newSets[setIndex].filter((s) => s.id !== songID), ...newSets.slice(setIndex + 1)]
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
            if (songs[i].classList.contains(songID)) {
              continue
            }
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
          sets: newSets
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
            setSetlist({
              ...setlist,
              sets: newSets
            })
            lastSort.func(lastSort.asc, newRep, lastSort.cat)
          }}>
            ✘ Delete set
          </div>
        </div>
        <table>
          <thead>
            <th>
              Title
            </th>
            <th>
              Artist
            </th>
            <th>
              length
            </th>
            {repertoire.categories.map((c) =>
              <th>
                {c.title}
              </th>
            )}
          </thead>
          <tbody>
            {set.map(songRow('set-' + index))}
          </tbody>
        </table>
        <div className='singleSetFoot'>
          {set.length} Songs, {setLength(set)}
        </div>
      </div>
    )
  }

  return (
    <div className='pageContainer'>
      <Header title='Edit setlist' leftButton={leftButton} />
      <div className='setlistBank'>
        <input id='concertTitle' type='text' defaultValue={setlist.concert} onInput={() => {
          const input = document.getElementById('concertTitle')
          setSetlist(storage.updateSetlist(id, {
            ...setlist, 
            concert: input.value
          }))
        }}/>
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
        {/* {JSON.stringify(setlist)} */}
      </div>
      <div className='repertoireBank' onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
        e.preventDefault()
        const songID = e.dataTransfer.getData('id')
        const from = e.dataTransfer.getData('from')
        console.log(songID, from)
        if (from === 'repertoire') {
          return
        }
        if (from.startsWith('set-')) {
          const setIndex = Number(from.substring(4))
          setSetlist(storage.updateSetlist(id, {
            ...setlist,
            sets: [...setlist.sets.slice(0, setIndex), setlist.sets[setIndex].filter((s) => s.id !== songID), ...setlist.sets.slice(setIndex + 1)]
          }))
          lastSort.func(lastSort.asc, {
            ...repertoire,
            songs: [...repertoire.songs, fullRepertoire.songs.find((s) => s.id === songID)]
          }, lastSort.cat)
        }
      }}>
        <table>
          <thead>
            <th>
              <div className='category' >
                Song title
                <div className='button' onClick={() => sortByName(true, repertoire)}>˄</div>
                <div className='button' onClick={() => sortByName(false, repertoire)}>˅</div>
              </div>
            </th>
            <th>
              <div className='category'>
                Artist
                <div className='button' onClick={() => sortByArtist(true, repertoire)}>˄</div>
                <div className='button' onClick={() => sortByArtist(false, repertoire)}>˅</div>
              </div>
            </th>
            <th>
              <div className='category'>
                Length
                <div className='button' onClick={() => sortByLength(true, repertoire)}>˄</div>
                <div className='button' onClick={() => sortByLength(false, repertoire)}>˅</div>
              </div>
            </th>
            {repertoire.categories.map((c) => <th>
              <div className='category'>
                {c.title}
                <div className='button' onClick={() => sortByCat(true, repertoire, c)}>˄</div>
                <div className='button' onClick={() => sortByCat(false, repertoire, c)}>˅</div>
              </div>
            </th>)}
          </thead>
          <tbody>
            {repertoire.songs.map(songRow('repertoire'))}
          </tbody>
        </table>
      </div>
    </div>
  )
}