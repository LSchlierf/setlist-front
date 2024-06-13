import { useState } from 'react';
import './App.css';
import storage from './storage'
import Header from './Header';
import { useNavigate } from 'react-router-dom';

function App() {
  const [setlists, setSetlists] = useState(storage.getSetlists())
  const [dialog, setDialog] = useState(<></>)

  let navigate = useNavigate()

  function editRepertoire() {
    navigate('editRepertoire')
  }

  function editSetlist(id) {
    return () => navigate('editSetlist', { state: id })
  }

  function newSetlist() {
    let id = storage.addSetlist({ concert: 'new setlist', sets: [], encore: [], breaks: { len: 20, buffer: 5 }, startTime: '19:30' })
    setSetlists(storage.getSetlists())
    editSetlist(id)()
  }

  function repertoireContainer() {
    return (
      <div className='container' onClick={editRepertoire}>
        <div className='button'>
          🖉 Edit Repertoire
        </div>
      </div>
    )
  }

  function setlistContainer(id) {
    const setlist = setlists[id]
    return (
      <div className='container' key={setlist.concert}>
        <div className='flexRow'>
          <div className='button' onClick={editSetlist(id)}>
            🖉 Edit {setlist.concert}
          </div>
          <div className='button' onClick={() => setSetlists(storage.deleteSetlist(id))}>
            🗑 Delete setlist
          </div>
        </div>
      </div>
    )
  }

  function separator() {
    return (
      <div style={{ width: 'calc(100% - 20px)', backgroundColor: 'lightgray', height: 4, margin: 10, boxSizing: 'border-box', borderRadius: 2 }} />
    )
  }

  return (
    <>
      <Header title='Setlist tool' />
      {dialog}
      {repertoireContainer()}
      {separator()}
      {Object.keys(setlists).map(setlistContainer)}
      {separator()}
      <div className='container' >
        <div className='button' onClick={newSetlist}>
          + Create new setlist
        </div>
        <div className='button' onClick={() => {
          setDialog(
            <dialog id='dialog' open>
              <u>Import setlist</u>
              <br />
              Import from JSON file:
              <br />
              <input id='setlistFileInput' accept='.json' type='file' onInput={() => {
                const input = document.getElementById('setlistFileInput')
                var reader = new FileReader()

                reader.onload = (e) => {
                  let newSetlist = JSON.parse(e.target.result)
                  if (newSetlist === undefined || newSetlist.concert === undefined || newSetlist.sets === undefined || newSetlist.encore === undefined) {
                    setDialog(
                      <dialog id='dialog' open>
                        <u>Invalid setlist</u>
                        <div className='dialogAction'>
                          <button type='button' onClick={() => setDialog(<></>)}>
                            Close
                          </button>
                        </div>
                      </dialog>
                    )
                    return
                  }
                  storage.addSetlist(newSetlist)
                  setSetlists(storage.getSetlists())
                  setDialog(<></>)
                }

                if (input.files.length > 0) {
                  reader.readAsText(input.files[0])
                }
              }} />
              <div className='dialogAction'>
                <button type='button' onClick={() => {
                  setDialog(<></>)
                }}>
                  Close
                </button>
              </div>
            </dialog>
          )
        }}>
          Import setlist from JSON
        </div>
      </div>
      {/* {JSON.stringify(Object.keys(setlists).map((k) => ({ id: k, concert: setlists[k].concert, sets: setlists[k].sets, encore: setlists[k].encore })))} but as map actually */}
    </>
  );
}

export default App;
