import { useEffect, useState } from 'react';
import './App.css';
import storage from './storage'
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

function App() {
  const [setlists, setSetlists] = useState([])
  const [dialog, setDialog] = useState(<></>)

  useEffect(() => {
    if (Cookies.get('token')) {
      storage.init().then(() => {
        if (storage.user.length > 0) {
          storage.socket.on('setlists', setSetlists)
          storage.getSetlists().then(setSetlists)
        }
      })
      return () => {
        storage.socket?.off('setlists', setSetlists)
      }
    }
  }, [])

  let navigate = useNavigate()

  function editRepertoire() {
    navigate('editRepertoire')
  }

  function editSetlist(id) {
    return () => navigate('editSetlist', { state: id })
  }

  function newSetlist() {
    storage.addSetlist().then(id => {
      storage.socket.emit('setlists')
      editSetlist({ id: id, concert: 'new setlist' })()
    })
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

  function setlistContainer(setlist) {
    return (
      <div className='container' key={setlist.concert}>
        <div className='flexRow'>
          <div className='button' onClick={editSetlist(setlist)}>
            🖉 Edit {setlist.concert}
          </div>
          <div className='button' onClick={() => {
            storage.deleteSetlist(setlist.id).then(setSetlists).then(() => {
              storage.socket.emit('setlists')
            })
          }
          }>
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

  function handleLogin(e) {
    e.preventDefault()
    const username = document.getElementById('usernameInput').value
    const password = document.getElementById('passwordInput').value
    let url = '/api/login'
    if (document.getElementById('passwordInput2')) {
      url = '/api/signup'
      const pw2 = document.getElementById('passwordInput2').value
      if (password !== pw2) {
        setDialog(<dialog id='dialog'>
          Passwords have to match<br />
          <button onClick={e => {
            e.preventDefault();
            setDialog(<></>)
          }} >OK</button>
        </dialog>)
        return
      }
    }
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 'username': username, 'password': password })
    }).then(async (r) => {
      if (!r.ok) {
        setDialog(<dialog id='dialog'>
          That didn't work<br />
          <button onClick={e => {
            e.preventDefault();
            setDialog(<></>)
          }} >OK</button>
        </dialog>)
        return
      }
      const t = await r.text()
      Cookies.set('token', t.substring(1, t.length - 1))
      setDialog(<></>)
      await storage.init()
      storage.getSetlists().then(setSetlists)
    }).catch(() => {
      setDialog(<dialog id='dialog'>
        That didn't work<br />
        <button onClick={e => {
          e.preventDefault();
          setDialog(<></>)
        }} >OK</button>
      </dialog>)
    })
  }

  function doLogin() {
    setDialog(
      <dialog id='dialog' open>
        <u>Log in</u>
        <form onSubmit={handleLogin}>
          <label for='usernameInput'>Username:</label><br />
          <input type='username' id='usernameInput' /><br />
          <label for='passwordInput'>Password:</label><br />
          <input type='password' id='passwordInput' /><br />
          <br /><button>OK</button>
          <button type='button' onClick={() => setDialog(<></>)}>
            Close
          </button>
        </form>
      </dialog>
    )
  }

  function doSignUp() {
    setDialog(
      <dialog id='dialog' open>
        <u>Sign up</u>
        <form onSubmit={handleLogin}>
          <label for='usernameInput'>Username:</label><br />
          <input type='username' id='usernameInput' /><br />
          <label for='passwordInput'>Password:</label><br />
          <input type='password' id='passwordInput' /><br />
          <label for='passwordInput2'>Repeat Password:</label><br />
          <input type='password' id='passwordInput2' /><br />
          <br /><button>OK</button>
          <button type='button' onClick={() => setDialog(<></>)}>
            Close
          </button>
        </form>
      </dialog>
    )
  }

  function doLogout() {
    setDialog(
      <dialog id='dialog' open>
        <span>Logged in as <u>{storage.user}</u></span>
        <br />
        <button onClick={() => {
          Cookies.remove('token')
          storage.logout()
          setSetlists([])
          setDialog(<></>)
        }}>Logout</button>
        <button type='button' onClick={() => setDialog(<></>)}>
          Close
        </button>
      </dialog>
    )
  }

  function loginPrompt() {
    return (
      <>
        <div className='loginPrompt'>
          <div><span className='loginLink' onClick={doLogin}>Log in</span> or <span className='loginLink' onClick={doSignUp}>Sign up</span></div>
        </div>
      </>
    )
  }

  function mainPage() {
    return (
      <>
        {repertoireContainer()}
        {separator()}
        {setlists.map(setlistContainer)}
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
                    storage.addSetlist().then(id => {
                      storage.updateSetlist(id, newSetlist).then(() => {
                        storage.getSetlists().then(setlists => {
                          setSetlists(setlists)
                          setDialog(<></>)
                        })
                        storage.socket.emit('setlists')
                      })
                    })
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
      </>
    );
  }

  return (
    <>
      <Header title='Setlist tool' rightButton={storage.user.length > 0 ? <div className='loginLink' onClick={doLogout}>{storage.user}</div> : <></>} />
      {dialog}
      {storage.user.length > 0 ? mainPage() : loginPrompt()}
    </>
  )
}

export default App;
