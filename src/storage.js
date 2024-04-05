import { v4 as uuidv4 } from 'uuid'

class storage {

    static LOCAL_STORAGE_KEY_REPERTOIRE = 'repertoire-object'
    static LOCAL_STORAGE_KEY_SETLISTS = 'setlists-object'

    static getRepertoire() {
        const savedRepertoire = JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_KEY_REPERTOIRE))
        if (savedRepertoire) return savedRepertoire
        return {categories: [], songs: []}
    }

    static saveRepertoire(repertoire) {
        localStorage.setItem(this.LOCAL_STORAGE_KEY_REPERTOIRE, JSON.stringify(repertoire))
        return repertoire
    }

    static getSetlists() {
        const savedSetlists = JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_KEY_SETLISTS))
        if (savedSetlists) return savedSetlists
        return {}
    }

    static addSetlist(setlist) {
        let savedSetlists = JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_KEY_SETLISTS))
        const id = uuidv4()
        if(!savedSetlists) savedSetlists = {}
        savedSetlists[id] = setlist
        localStorage.setItem(this.LOCAL_STORAGE_KEY_SETLISTS, JSON.stringify(savedSetlists))
        return id;
    }

    static updateSetlist(id, setlist) {
        let savedSetlists = JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_KEY_SETLISTS))
        if (!savedSetlists) savedSetlists = {}
        savedSetlists[id] = setlist
        localStorage.setItem(this.LOCAL_STORAGE_KEY_SETLISTS, savedSetlists)
    }

    static deleteSetlist(id) {
        let savedSetlists = JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_KEY_SETLISTS))
        delete savedSetlists[id]
        localStorage.setItem(this.LOCAL_STORAGE_KEY_SETLISTS, JSON.stringify(savedSetlists))
    }

    static clearSetlists() {
        localStorage.setItem(this.LOCAL_STORAGE_KEY_SETLISTS, {})
    }

}

export default storage