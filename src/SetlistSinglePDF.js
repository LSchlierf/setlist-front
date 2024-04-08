import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import React from "react";

function SetlistSinglePDF(props) {
  const styles = StyleSheet.create({
    page: { padding: 40, display: 'flex', flexDirection: 'column', flexWrap: 'wrap', maxHeight: '100vh' },
    set: { padding: 15, width: '50%' },
    setTitle: { fontWeight: 700, fontSize: 20, fontFamily: 'Helvetica-Bold' },
    setSong: { borderTop: '2px solid black', padding: 5 },
    song: { fontFamily: 'Helvetica', fontSize: 15 },
  })

  let sets = []
  for (let i = 0; i < props.setlist.sets.length; i += 4) {
    sets.push(props.setlist.sets.slice(i, i + 4).map((set) => ({ type: 'set', songs: set })))
  }
  if (sets[sets.length - 1].length < 4) {
    sets[sets.length - 1].push({ type: 'encore', songs: props.setlist.encore })
  } else {
    sets.push([{ type: 'encore', songs: props.setlist.encore }])
  }

  function setDisplay(set, title) {
    return (
      <View key={title} style={styles.set}>
        <View >
          <Text style={styles.setTitle}>
            {title}
          </Text>
        </View>
        {set.songs.map((song) => <View key={song.id} style={styles.setSong} >
          <Text style={styles.song}>
            {song.title}
          </Text>
        </View>)}
      </View>
    )
  }


  return (
    <Document creator={undefined} producer={undefined} >
      {sets.map((setGroup, pageIndex) =>
        <Page key={pageIndex} style={styles.page}>
          {setGroup.map((set, setIndex) => {
            if (set.type === 'set') {
              return setDisplay(set, 'Set ' + (pageIndex * 4 + setIndex + 1))
            } else if (set.type === 'encore') {
              return setDisplay(set, 'Encore:')
            }
            return null
          })}
        </Page>
      )}
    </Document>
  )
}

export default SetlistSinglePDF