import { useState } from 'react';
import './App.css';
import storage from './storage'
import Header from './Header';
import { useNavigate } from 'react-router-dom';

function App() {
  const [setlists, setSetlists] = useState(storage.getSetlists())

  let navigate = useNavigate()

  function editRepertoire() {
    navigate('editRepertoire')
  }

  function editSetlist(id) {
    return () => navigate('editSetlist', { state: id })
  }

  function newSetlist() {
    let id = storage.addSetlist({ concert: 'new setlist', sets: [], encore: [] })
    setSetlists(storage.getSetlists())
    editSetlist(id)()
  }

  function repertoireContainer() {
    return (
      <div className='container' onClick={editRepertoire}>
        🖉 Edit Repertoire
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
      {repertoireContainer()}
      {separator()}
      {Object.keys(setlists).map(setlistContainer)}
      {separator()}
      <div className='container' onClick={newSetlist}>
        + Create new setlist
      </div>
      {/* {JSON.stringify(Object.keys(setlists).map((k) => ({ id: k, concert: setlists[k].concert, sets: setlists[k].sets, encore: setlists[k].encore })))} but as map actually */}
    </>
  );
}

export default App;
