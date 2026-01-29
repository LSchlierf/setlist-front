import { io, Socket } from "socket.io-client";

class storage {
  private static _socket: Socket | undefined = undefined;
  private static _user: { id: string; name: string } | undefined = undefined;
  private static _token: string | undefined = undefined;

  static async init() {
    this._token = localStorage.getItem("AUTH_TOKEN") || undefined;
    this._user = await this.testToken();
    if (this._user && this._token && !this._socket) {
      this._socket = io("/", {
        extraHeaders: {
          token: this._token,
        },
      });
    }
    return this.user;
  }

  static async testToken() {
    if (!this._token) {
      return;
    }
    const userInfo = await fetch("/api/user/ping", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this._token}`,
      },
    })
      .then((response) => response.text())
      .catch(() => undefined);

    return !!userInfo && JSON.parse(userInfo);
  }

  static logout() {
    localStorage.removeItem("AUTH_TOKEN");
    this._user = undefined;
    this._socket?.disconnect();
    this._socket = undefined;
    this._token = undefined;
  }

  static get user() {
    return this._user;
  }

  static async getSetlists() {
    return await fetch("/api/user/setlists", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this._token}`,
      },
    })
      .then((response) => response.json())
      .catch(() => undefined);
  }

  static async getRepertoireSize() {
    return await fetch("/api/user/repertoire/size", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this._token}`,
      },
    })
      .then((response) => response.json())
      .catch(() => undefined);
  }

  static async addSetlist() {
    return await fetch("/api/user/setlist/create", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this._token}`,
      },
    })
      .then((response) => response.json())
      .catch(() => undefined);
  }

  static async deleteSetlist(id: string) {
    return await fetch(`/api/user/setlist/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this._token}`,
      },
    });
  }

  static async getSongs() {
    return await fetch("/api/user/repertoire/songs", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this._token}`,
      },
    })
      .then((response) => response.json())
      .catch(() => undefined);
  }

  static async getCategories() {
    return await fetch("/api/user/repertoire/categories", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this._token}`,
      },
    })
      .then((response) => response.json())
      .catch(() => undefined);
  }

  // static async getRepertoire() {
  //     const repertoire = await fetch('/api/repertoire', {
  //         method: 'GET',
  //         headers: {
  //             'Accept': 'application/json',
  //             'Authorization': `Bearer ${token}`
  //         }
  //     }).then(response => response.json()).catch(() => undefined) || {}
  //     return repertoire
  // }

  // static async saveRepertoire(repertoire) {
  //     await fetch('/api/repertoire', {
  //         method: 'POST',
  //         headers: {
  //             'Content-Type': 'application/json',
  //             'Authorization': `Bearer ${this.token}`
  //         },
  //         body: JSON.stringify(repertoire)
  //     })
  //     return await this.getRepertoire()
  // }

  // static async getSetlist(id) {
  //     const token = Cookies.get('token')
  //     return await fetch(`/api/setlist/${id}`, {
  //         method: 'GET',
  //         headers: {
  //             'Accept': 'application/json',
  //             'Authorization': `Bearer ${token}`
  //         }
  //     }).then(response => response.json())
  // }

  // static async addSetlist() {
  //     const token = Cookies.get('token')
  //     return await fetch('/api/setlist', {
  //         method: 'POST',
  //         headers: {
  //             'Accept': 'text/plain',
  //             'Authorization': `Bearer ${token}`
  //         }
  //     }).then(response => response.text())
  // }

  // static async updateSetlist(id, setlist) {
  //     const token = Cookies.get('token')
  //     await fetch(`/api/setlist/${id}`, {
  //         method: 'POST',
  //         headers: {
  //             'Content-Type': 'application/json',
  //             'Authorization': `Bearer ${token}`
  //         },
  //         body: JSON.stringify(setlist)
  //     })
  //     return await this.getSetlist(id)
  // }

  // static async deleteSetlist(id) {
  //     const token = Cookies.get('token')
  //     await fetch(`/api/setlist/${id}`, {
  //         method: 'DELETE',
  //         headers: {
  //             'Authorization': `Bearer ${token}`
  //         }
  //     })
  //     return await this.getSetlists()
  // }
}

export default storage;
