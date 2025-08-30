import { io } from 'socket.io-client'
import Cookies from 'js-cookie';

class storage {

    static socket = undefined;
    static user = '';

    static async init() {
        this.user = await this.testToken()
        if (this.user.length > 0 && !this.socket) {
            this.socket = io('/', {
                extraHeaders: {
                    'token': Cookies.get('token'),
                }
            })
        }
    }

    static logout() {
        this.user = ''
        this.socket?.disconnect()
        this.socket = undefined
    }

    static async getRepertoire() {
        const token = Cookies.get('token')
        const repertoire = await fetch('/api/repertoire', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }).then(response => response.json()).catch(() => undefined) || {}
        return repertoire
    }

    static async saveRepertoire(repertoire) {
        const token = Cookies.get('token')
        await fetch('/api/repertoire', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(repertoire)
        })
        return await this.getRepertoire()
    }

    static async testToken() {
        if (!Cookies.get('token')) {
            return ""
        }
        const token = Cookies.get('token')
        return await fetch('/api/pinguser', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }).then(response => response.text()).catch(() => "")
    }

    static async getSetlists() {
        const token = Cookies.get('token')
        return await fetch('/api/setlists', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }).then(response => response.json()).catch(() => [])
    }

    static async getSetlist(id) {
        const token = Cookies.get('token')
        return await fetch(`/api/setlist/${id}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }).then(response => response.json())
    }

    static async addSetlist() {
        const token = Cookies.get('token')
        return await fetch('/api/setlist', {
            method: 'POST',
            headers: {
                'Accept': 'text/plain',
                'Authorization': `Bearer ${token}`
            }
        }).then(response => response.text())
    }

    static async updateSetlist(id, setlist) {
        const token = Cookies.get('token')
        await fetch(`/api/setlist/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(setlist)
        })
        return await this.getSetlist(id)
    }

    static async deleteSetlist(id) {
        const token = Cookies.get('token')
        await fetch(`/api/setlist/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        return await this.getSetlists()
    }
}

export default storage