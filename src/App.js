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
    return () => navigate('editConcert', { state: id })
  }

  function newSetlist() {
    let id = storage.addSetlist({ concert: '', sets: [], encore: [], repertoire: storage.getRepertoire() })
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
      <div className='container' key={setlist.concert} onClick={editSetlist(id)}>
        🖉 Edit {setlist.concert}
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
      <div className='container' onClick={newSetlist}>
        + New Setlist
      </div>
      {Object.keys(setlists).map(setlistContainer)}
      {/* {JSON.stringify(Object.keys(setlists).map((k) => ({ id: k, concert: setlists[k].concert, sets: setlists[k].sets, encore: setlists[k].encore })))} but as map actually */}
    </>
  );
}

export default App;
