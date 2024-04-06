function byName(songs, asc) {
  return songs.sort((s1, s2) => {
    if (s1.title === s2.title) {
      return 0;
    }
    return (asc === (1 === s1.title.localeCompare(s2.title))) ? 1 : -1
  })
}

function byArtist(songs, asc) {
  return songs.sort((s1, s2) => {
    if (s1.artist === s2.artist) {
      return 0;
    }
    return (asc === (1 === s1.artist.localeCompare(s2.artist))) ? 1 : -1
  })
}

function byLength(songs, asc) {
  return songs.sort((s1, s2) => {
    return asc ? s1.length - s2.length : s2.length - s1.length
  })
}

function byCat(songs, asc, cat) {
  return songs.sort((s1, s2) => {
    let p1, p2
    switch (cat.type) {
      case 'bool':
        p1 = Boolean(s1.properties[cat.id] || false)
        p2 = Boolean(s2.properties[cat.id] || false)
        return p1 === p2 ? 0 : (p1 === asc ? 1 : -1)
      case 'number':
        p1 = Number(s1.properties[cat.id] || 0)
        p2 = Number(s2.properties[cat.id] || 0)
        return asc ? p1 - p2 : p2 - p1
      case 'string':
        p1 = String(s1.properties[cat.id] || '')
        p2 = String(s2.properties[cat.id] || '')
        return asc ? p1.localeCompare(p2) : p2.localeCompare(p1)
      default:
        return 0
    }
  })
}

export { byName, byArtist, byLength, byCat }