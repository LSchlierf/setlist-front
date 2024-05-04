import './EditRepertoire.css'

import React, { useState } from 'react'
import Header from './Header'
import storage from './storage'

import { v4 as uuidv4 } from 'uuid'
import { useNavigate } from 'react-router-dom'

import { byName, byArtist, byLength, byCat } from './songSort'
import { downloadFile } from './util'

export default function EditRepertoire(props) {
  const [repertoire, setRepertoire] = useState(storage.getRepertoire())
  const [dialog, setDialog] = useState(<></>)

  let navigate = useNavigate()

  function deleteCategory(id) {
    setRepertoire(storage.saveRepertoire({ ...repertoire, categories: repertoire.categories.filter((c) => c.id !== id), songs: repertoire.songs.map(s => { delete s.properties[id]; return s }) }))
  }

  function addCategory() {
    const enableNext = () => {
      const button = document.getElementById('newCategoryNext')
      button.disabled = document.getElementById('newCategoryName').value.length === 0 || document.querySelector('input[name=type]:checked') === null
      button.onclick = (e) => {
        e.preventDefault()
        let name = document.getElementById('newCategoryName').value
        let type = ['newCategoryNumber', 'newCategoryString', 'newCategoryBool', 'newCategoryStringMultiple'].indexOf(document.querySelector('input[name=type]:checked').id)
        addCategoryValues(name, type)
      }
    }

    setDialog(
      <dialog id='dialog' open>
        New Category
        <form>
          <input id='newCategoryName' type='text' placeholder='Category name' onInput={enableNext} />
          <br />
          <br />
          <u>Type</u>
          <br />
          <input type='radio' id='newCategoryNumber' name='type' onInput={enableNext} />
          <label htmlFor='newCategoryNumber'>Number</label>
          <br />
          <input type='radio' id='newCategoryString' name='type' onInput={enableNext} />
          <label htmlFor='newCategoryString'>Text (Single Select)</label>
          <br />
          <input type='radio' id='newCategoryStringMultiple' name='type' onInput={enableNext} />
          <label htmlFor='newCategoryStringMultiple'>Text (Multiple Select)</label>
          <br />
          <input type='radio' id='newCategoryBool' name='type' onInput={enableNext} />
          <label htmlFor='newCategoryBool'>True / False</label>
          <br />
          <br />
          <div className='dialogAction'>
            <button onClick={(e) => { e.preventDefault(); setDialog(<></>) }}>Cancel</button>
            <button id='newCategoryNext' disabled >
              Next
            </button>
          </div>
        </form>
      </dialog>
    )
  }

  function addNumber(name) {
    const checkInputMin = () => {
      let min = document.getElementById('newCategoryMin')
      let max = document.getElementById('newCategoryMax')
      if (Number(min.value) >= Number(max.value)) {
        min.value = Number(max.value) - 1
      }
    }
    const checkInputMax = () => {
      let min = document.getElementById('newCategoryMin')
      let max = document.getElementById('newCategoryMax')
      if (Number(max.value) <= Number(min.value)) {
        max.value = Number(min.value) + 1
      }
    }

    setDialog(
      <dialog id='dialog' open>
        Add Value Range for {name}
        <form>
          Min:
          <br />
          <input type='number' placeholder='min' min={0} defaultValue={0} id='newCategoryMin' onInput={checkInputMin} />
          <br />
          <br />
          Max:
          <br />
          <input type='number' placeholder='max' min={0} defaultValue={10} id='newCategoryMax' onInput={checkInputMax} />
          <br />
          <br />
          <div className='dialogAction'>
            <button onClick={(e) => { e.preventDefault(); setDialog(<></>) }}>Cancel</button>
            <button id='newCategoryOk' onClick={(e) => {
              e.preventDefault()
              let min = Number(document.getElementById('newCategoryMin').value)
              let max = Number(document.getElementById('newCategoryMax').value)
              setRepertoire(storage.saveRepertoire({ ...repertoire, categories: [...repertoire.categories, { type: 'number', title: name, valueRange: Array.from({ length: max - min + 1 }, (_, i) => min + i), id: uuidv4() }] }))
              setDialog(<></>)
            }}>Ok</button>
          </div>
        </form>
      </dialog>
    )
  }

  function addString(name, options) {
    setDialog(
      <dialog id='dialog' open>
        Add Values for {name}
        <form onSubmit={(e) => {
          e.preventDefault()
          let input = document.getElementById('newCategoryOption')
          let value = input.value
          if (value !== '' && options.indexOf(value) === -1) {
            input.value = ''
            addString(name, [...options, value])
          }
        }}>
          {options.map((o) => {
            return <div style={{ padding: 3 }} key={o}>
              {o}
            </div>
          })}
          <input id='newCategoryOption' type='text' />
          <div className='dialogAction'>
            <button type='button' onClick={(e) => { e.preventDefault(); setDialog(<></>) }}>Cancel</button>
            <button type='button' onClick={(e) => {
              e.preventDefault()
              setRepertoire(storage.saveRepertoire({ ...repertoire, categories: [...repertoire.categories, { type: 'string', title: name, valueRange: options, id: uuidv4() }] }))
              setDialog(<></>)
            }}>Ok</button>
          </div>
        </form>
      </dialog>
    )
  }

  function addStringMultiple(name, options) {
    setDialog(
      <dialog id='dialog' open>
        Add Values for {name}
        <form onSubmit={(e) => {
          e.preventDefault()
          let input = document.getElementById('newCategoryOption')
          let value = input.value
          if (value !== '' && options.indexOf(value) === -1) {
            input.value = ''
            addStringMultiple(name, [...options, value])
          }
        }}>
          {options.map((o) => {
            return <div style={{ padding: 3 }} key={o}>
              {o}
            </div>
          })}
          <input id='newCategoryOption' type='text' />
          <div className='dialogAction'>
            <button type='button' onClick={(e) => { e.preventDefault(); setDialog(<></>) }}>Cancel</button>
            <button type='button' onClick={(e) => {
              e.preventDefault()
              setRepertoire(storage.saveRepertoire({ ...repertoire, categories: [...repertoire.categories, { type: 'stringMultiple', title: name, valueRange: options, id: uuidv4() }] }))
              setDialog(<></>)
            }}>Ok</button>
          </div>
        </form>
      </dialog>
    )
  }

  function addCategoryValues(name, type) {
    switch (type) {
      case 0:
        addNumber(name)
        break
      case 1:
        addString(name, [])
        break
      case 2:
        setRepertoire(storage.saveRepertoire({ ...repertoire, categories: [...repertoire.categories, { type: 'bool', title: name, valueRange: [true, false], id: uuidv4() }] }))
        setDialog(<></>)
        break
      case 3:
        addStringMultiple(name, [])
        break;
      default:
        setDialog(<></>)
        break
    }
  }

  function addSong() {
    setRepertoire(storage.saveRepertoire({ ...repertoire, songs: [...repertoire.songs, { title: '', length: 180, properties: {}, id: uuidv4() }] }))
  }

  function updateTitle(id) {
    const title = document.getElementById(id + '-title').value

    setRepertoire(storage.saveRepertoire({
      ...repertoire,
      songs: repertoire.songs.map((song) => {
        if (song.id === id) {
          return {
            ...song,
            title: title
          }
        }
        return song
      })
    }))
  }

  function updateArtist(id) {
    const artist = document.getElementById(id + '-artist').value

    setRepertoire(storage.saveRepertoire({
      ...repertoire,
      songs: repertoire.songs.map((song) => {
        if (song.id === id) {
          return {
            ...song,
            artist: artist
          }
        }
        return song
      })
    }))
  }

  function updateNotes(id) {
    const notes = document.getElementById(id + '-notes').value

    setRepertoire(storage.saveRepertoire({
      ...repertoire,
      songs: repertoire.songs.map((song) => {
        if (song.id === id) {
          return {
            ...song,
            notes: notes
          }
        }
        return song
      })
    }))
  }

  function updateTime(id) {
    let min = document.getElementById(id + '-min')
    let sec = document.getElementById(id + '-sec')

    if (Number(sec.value) === 60) {
      if (Number(min.value) < 59) {
        sec.value = 0
        min.value = Number(min.value) + 1
      } else {
        sec.value = 59
      }
    } else if (Number(sec.value) === -1) {
      if (Number(min.value) > 0) {
        sec.value = 59
        min.value = Number(min.value) - 1
      } else {
        sec.value = 0
      }
    }

    setRepertoire(storage.saveRepertoire({
      ...repertoire,
      songs: repertoire.songs.map((song) => {
        if (song.id === id) {
          return {
            ...song,
            length: (Number(min.value) * 60) + Number(sec.value)
          }
        }
        return song
      })
    }))
  }

  function multipleStringSelect(cat, song) {
    return () => {
      setDialog(
        <dialog id='dialog' open>
          Select {cat.title} for {song.title}
          <br />
          <form>
            {cat.valueRange.map((v) => <>
              <input key={v + '-input'} type='checkBox' id={cat.id + v} name={v} defaultChecked={song.properties?.[cat.id]?.includes(v) ? true : false} className={cat.id + '-select'} />
              <label key={v + '-label'} htmlFor={v}>{v}</label>
              <br key={v + '-br'} />
            </>)}
          </form>
          <div className='dialogAction'>
            <button type='button' onClick={() => setDialog(<></>)}>Cancel</button>
            <button type='button' onClick={() => {
              let selectedList = []
              for (let item of document.getElementsByClassName(cat.id + '-select')){
                if(item.checked) {
                  selectedList.push(item.name)
                }
              }
              setRepertoire(storage.saveRepertoire({
                ...repertoire,
                songs: repertoire.songs.map((s) => {
                  if (s.id === song.id) {
                    s.properties[cat.id] = selectedList
                  }
                  return s
                })
              }))
              setDialog(<></>)
            }}>Ok</button>
          </div>
        </dialog>
      )
    }
  }

  function catSelector(cat, song) {
    switch (cat.type) {
      case 'bool':
        return (
          <input defaultChecked={song.properties[cat.id]} id={song.id + '-' + cat.id} type='checkbox' onInput={() => {
            let input = document.getElementById(song.id + '-' + cat.id)
            setRepertoire(storage.saveRepertoire({
              ...repertoire,
              songs: repertoire.songs.map((s) => {
                if (s.id === song.id) {
                  s.properties[cat.id] = input.checked
                }
                return s
              })
            }))
          }} />
        )
      case 'string':
        return (
          <select defaultValue={song.properties[cat.id]} id={song.id + '-' + cat.id} onInput={() => {
            let input = document.getElementById(song.id + '-' + cat.id)
            setRepertoire(storage.saveRepertoire({
              ...repertoire,
              songs: repertoire.songs.map((s) => {
                if (s.id === song.id) {
                  s.properties[cat.id] = input.value
                }
                return s
              })
            }))
          }}>
            <option value=''>Select</option>
            {cat.valueRange.map((val) => <option key={val} value={val}>{val}</option>)}
          </select>
        )
      case 'stringMultiple':
        return (
          <div className='slimButton' onClick={multipleStringSelect(cat, song)}>
            {(song.properties && song.properties[cat.id] && song.properties[cat.id].length !== 0) ? song.properties[cat.id].join(', ') : 'Select'}
          </div>
        )
      case 'number':
        return (
          <input style={{ width: 100 }} defaultValue={song.properties[cat.id]} type='number' min={cat.valueRange[0]} max={cat.valueRange[cat.valueRange.length - 1]} id={song.id + '-' + cat.id} onInput={() => {
            let input = document.getElementById(song.id + '-' + cat.id)
            setRepertoire(storage.saveRepertoire({
              ...repertoire,
              songs: repertoire.songs.map((s) => {
                if (s.id === song.id) {
                  s.properties[cat.id] = input.value
                }
                return s
              })
            }))
          }} />
        )
      default:
        return 'c'
    }
  }

  function songRow(song) {
    return (
      <tr draggable='true' id={song.id} key={song.id} onDragStart={(e) => { e.dataTransfer.setData('id', song.id); e.dataTransfer.setData('type', 'song') }}>
        <td>
          <input id={song.id + '-title'} type='text' placeholder='Title' defaultValue={song.title} onChange={() => updateTitle(song.id)} />
        </td>
        <td>
          <input id={song.id + '-artist'} type='text' placeholder='Artist' defaultValue={song.artist} onChange={() => updateArtist(song.id)} />
        </td>
        <td>
          <input className='time' id={song.id + '-min'} type='number' min={0} max={59} defaultValue={Math.floor(song.length / 60)} onChange={() => updateTime(song.id)} />
          m
          <input className='time' id={song.id + '-sec'} type='number' min={-1} max={60} defaultValue={song.length % 60} onChange={() => updateTime(song.id)} />
          s
        </td>
        {repertoire.categories.filter((c) => c.show === undefined ? true : c.show).map((c) => {
          return <td key={c.id} style={{
            backgroundColor: repertoire.color?.category === c.id ? repertoire.color.colors[song.properties[c.id]] : null
          }}>
            {catSelector(c, song)}
          </td>
        })}
        <td>
          <input id={song.id + '-notes'} type='text' placeholder='Notes' defaultValue={song.notes} onChange={() => updateNotes(song.id)} />
        </td>
        <td className='button' onClick={
          () => setRepertoire(storage.saveRepertoire({ ...repertoire, songs: repertoire.songs.filter(({ id }) => id !== song.id) }))
        }>
          ✘ Delete song
        </td>
      </tr>
    )
  }

  function totalLength() {
    let sum = repertoire.songs.reduce((a, s) => a + s.length, 0)
    return Math.floor(sum / 3600) + 'h, ' + (Math.floor(sum / 60) % 60) + 'm, ' + (sum % 60) + 's'
  }

  function downloadJSON() {
    downloadFile({
      data: JSON.stringify(repertoire, null, 2),
      fileName: 'repertoire.json',
      fileType: 'text/json'
    })

    setDialog(<></>)
  }

  function downloadTXT() {
    downloadFile({
      data: repertoire.songs.map((s) => s.title + ' - ' + s.artist + '\n').sort().join(''),
      fileName: 'repertoire.txt',
      fileType: 'text/txt'
    })

    setDialog(<></>)
  }

  function io() {
    setDialog(
      <dialog id='dialog' open>
        <u>Import / Export Repertoire</u>
        <br />
        Import from JSON file:
        <br />
        <input id='repertoireFileInput' accept='.json' type='file' onInput={() => {
          const input = document.getElementById('repertoireFileInput')
          var reader = new FileReader()

          reader.onload = (e) => {
            let newRepertoire = JSON.parse(e.target.result)
            if (newRepertoire === undefined || newRepertoire.categories === undefined || newRepertoire.songs === undefined) {
              setDialog(
                <dialog id='dialog' open >
                  <u>Invalid repertoire</u>
                  <div className='dialogAction'>
                    <button type='button' onClick={() => setDialog(<></>)}>
                      Close
                    </button>
                  </div>
                </dialog>
              )
              return
            }
            setRepertoire(storage.saveRepertoire(newRepertoire))
            setDialog(<></>)
          }

          if (input.files.length > 0) {
            reader.readAsText(input.files[0])
          }
        }} />
        < br />
        <br />
        Export to JSON file:
        <br />
        <button type='button' onClick={(e) => { e.preventDefault(); downloadJSON() }}>
          Download JSON
        </button>
        <br />
        <br />
        Export title / artist to txt file:
        <br />
        <button type='button' onClick={(e) => { e.preventDefault(); downloadTXT() }}>
          Download txt
        </button>
        <br />
        <div className='dialogAction'>
          <button type='button' onClick={() => setDialog(<></>)}>
            Close
          </button>
        </div>
      </dialog >
    )
  }

  function colorSelectDialog(id) {
    if (id.length === 0) {
      setRepertoire(storage.saveRepertoire({
        ...repertoire,
        color: null
      }))
      setDialog(<></>)
      return
    }
    setDialog(
      <dialog id='dialog' open>
        <u>Select colors</u>
        {repertoire.categories.find((c) => c.id === id).valueRange.map((v) => <div className='catColorSingle' key={v}>
          {String(v)}
          <input type='color' defaultValue={repertoire.color?.category === id ? repertoire.color.colors[v] : '#313131'} id={id + '-' + v}></input>
        </div>)}
        <div className='dialogAction'>
          <button type='button' onClick={() => setDialog(<></>)}>Cancel</button>
          <button type='button' onClick={() => {
            let colors = {}
            let vals = repertoire.categories.find((c) => c.id === id).valueRange
            for (let i = 0; i < vals.length; i++) {
              let input = document.getElementById(id + '-' + vals[i])
              colors[vals[i]] = input.value
            }
            setRepertoire(storage.saveRepertoire({
              ...repertoire,
              color: {
                category: id,
                colors: colors
              }
            }))
            setDialog(<></>)
          }}>
            Ok
          </button>
        </div>
      </dialog>
    )
  }

  function colorDialog() {
    setDialog(
      <dialog id='dialog' open>
        <u>Choose category for Color</u>
        <select id='colorCat' >
          <option value='' >None</option>
          {repertoire.categories.map((c) => <option key={c.id} value={c.id} id={c.id} >{c.title}</option>)}
        </select>
        <div className='dialogAction'>
          <button type='button' onClick={() => setDialog(<></>)}>Cancel</button>
          <button type='button' onClick={() => {
            let input = document.getElementById('colorCat')
            colorSelectDialog(input.value)
          }}>
            Next
          </button>
        </div>
      </dialog>
    )
  }

  function sortByName(asc) {
    setRepertoire(storage.saveRepertoire({
      ...repertoire,
      songs: byName(repertoire.songs, asc)
    }))
  }

  function sortByArtist(asc) {
    setRepertoire(storage.saveRepertoire({
      ...repertoire,
      songs: byArtist(repertoire.songs, asc)
    }))
  }

  function sortByLength(asc) {
    setRepertoire(storage.saveRepertoire({
      ...repertoire,
      songs: byLength(repertoire.songs, asc)
    }))
  }

  function sortByCat(asc, id) {
    setRepertoire(storage.saveRepertoire({
      ...repertoire,
      songs: byCat(repertoire.songs, asc, repertoire.categories.find((c) => c.id === id))
    }))
  }

  let leftButton = (
    <div onClick={() => navigate('/')} className='button'>
      Back
    </div>
  )

  return (
    <>
      <Header title='Edit Repertoire' leftButton={leftButton} />
      <table style={{ maxWidth: 'calc(100% - 20px' }}>
        <thead>
          <tr onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
            e.preventDefault()
            if (e.dataTransfer.getData('type') !== 'category') {
              return
            }
            let id = e.dataTransfer.getData('id')
            let x = e.clientX
            let headers = document.getElementsByClassName('categoryHeader')
            if (headers.length === 0 || x < headers[0].getBoundingClientRect().left) {
              setRepertoire(storage.saveRepertoire({ ...repertoire, categories: [repertoire.categories.find((c) => c.id === id), ...repertoire.categories.filter((c) => c.id !== id)] }))
            } else if (x > headers[headers.length - 1].getBoundingClientRect().right) {
              setRepertoire(storage.saveRepertoire({ ...repertoire, categories: [...repertoire.categories.filter((c) => c.id !== id), repertoire.categories.find((c) => c.id === id)] }))
            } else {
              for (let i = 0; i < repertoire.categories.length; i++) {
                if (id === repertoire.categories[i].id) {
                  continue
                }
                let rect = document.getElementById(repertoire.categories[i].id)?.getBoundingClientRect()
                if(rect === undefined) {
                  continue
                }
                if (x >= rect.left && x <= rect.right) {
                  if (x - rect.left < rect.right - x) {
                    let otherCatsL = repertoire.categories.slice(0, i).filter((c) => c.id !== id)
                    let cat = repertoire.categories.find((c) => c.id === id)
                    let otherCatsR = repertoire.categories.slice(i).filter((c) => c.id !== id)
                    setRepertoire(storage.saveRepertoire({ ...repertoire, categories: [...otherCatsL, cat, ...otherCatsR] }))
                  } else {
                    let otherCatsL = repertoire.categories.slice(0, i + 1).filter((c) => c.id !== id)
                    let cat = repertoire.categories.find((c) => c.id === id)
                    let otherCatsR = repertoire.categories.slice(i + 1).filter((c) => c.id !== id)
                    setRepertoire(storage.saveRepertoire({ ...repertoire, categories: [...otherCatsL, cat, ...otherCatsR] }))
                  }
                }
              }
            }
          }}>
            <th>
              <div className='category' >
                Song title
                <div className='button' onClick={() => sortByName(true)}>˄</div>
                <div className='button' onClick={() => sortByName(false)}>˅</div>
              </div>
            </th>
            <th>
              <div className='category'>
                Artist
                <div className='button' onClick={() => sortByArtist(true)}>˄</div>
                <div className='button' onClick={() => sortByArtist(false)}>˅</div>
              </div>
            </th>
            <th>
              <div className='category'>
                Length
                <div className='button' onClick={() => sortByLength(true)}>˄</div>
                <div className='button' onClick={() => sortByLength(false)}>˅</div>
              </div>
            </th>
            {repertoire.categories.filter((c) => c.show === undefined ? true : c.show).map((c) => <th draggable='true' className='categoryHeader' id={c.id} key={c.id} onDragStart={(e) => {
              e.dataTransfer.setData('id', c.id)
              e.dataTransfer.setData('type', 'category')
            }}>
              <div className='category'>
                {c.title}
                <div className='button' onClick={() => sortByCat(true, c.id)}>˄</div>
                <div className='button' onClick={() => sortByCat(false, c.id)}>˅</div>
                <div className='button' onClick={
                  () => deleteCategory(c.id)
                } >
                  ✘
                </div>
              </div>
            </th>)}
            <th>
              Notes
            </th>
            <th className='button' onClick={addCategory}>
              + Add Category
            </th>
          </tr>
        </thead>
        <tbody onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.getData('type') !== 'song') {
            return
          }
          let id = e.dataTransfer.getData('id')
          let y = e.clientY
          for (let i = 0; i < repertoire.songs.length; i++) {
            if (repertoire.songs[i].id === id) {
              continue
            }
            let rect = document.getElementById(repertoire.songs[i].id).getBoundingClientRect()
            if (y >= rect.top && y <= rect.bottom) {
              if (y - rect.top < rect.bottom - y) {
                let otherSongsT = repertoire.songs.slice(0, i).filter((s) => s.id !== id)
                let song = repertoire.songs.find((s) => s.id === id)
                let otherSongsB = repertoire.songs.slice(i).filter((s) => s.id !== id)
                setRepertoire(storage.saveRepertoire({ ...repertoire, songs: [...otherSongsT, song, ...otherSongsB] }))
              } else {
                let otherSongsT = repertoire.songs.slice(0, i + 1).filter((s) => s.id !== id)
                let song = repertoire.songs.find((s) => s.id === id)
                let otherSongsB = repertoire.songs.slice(i + 1).filter((s) => s.id !== id)
                setRepertoire(storage.saveRepertoire({ ...repertoire, songs: [...otherSongsT, song, ...otherSongsB] }))
              }
            }
          }
        }}>
          {repertoire.songs.map(songRow)}
        </tbody>
      </table>
      <div onClick={addSong} className='button'>
        + Add Song
      </div>
      <div onClick={colorDialog} className='button'>
        Associate Color
      </div>
      <div onClick={io} className='button'>
        Import / Export Repertoire
      </div>
      <div className='info'>
        Total songs: {repertoire.songs.length}
        <br />
        Total length: {totalLength()}
        <br />
        <br />
        Show categories:
        <br />
        {repertoire.categories.map((c) => (
          <div key={'categoryShowSelect-' + c.id} ><input defaultChecked={c.show === undefined ? true : c.show} id={'showCategoryCheckBox-' + c.id} type='checkbox' onInput={() => {
            const input = document.getElementById('showCategoryCheckBox-' + c.id)
            let newCategories = repertoire.categories.map((cat) => {
              if (cat.id === c.id) {
                return {
                  ...cat,
                  show: input.checked
                }
              }
              return cat
            })
            setRepertoire(storage.saveRepertoire({
              ...repertoire,
              categories: newCategories
            }))
          }}/>{c.title}</div>
        ))}
        {/* {JSON.stringify(repertoire, null, 2)} */}
      </div>
      {dialog}
    </>
  )
}