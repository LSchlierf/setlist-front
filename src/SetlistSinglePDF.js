import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import React from "react";

function SetlistSinglePDF(props) {
  const styles = StyleSheet.create({
    page: { padding: 40, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', maxHeight: '100vh' },
    set: { padding: 15, width: '50%' },
    setTitle: { fontWeight: 700, fontSize: 20, fontFamily: 'Helvetica-Bold' },
    setSong: { borderTop: '2px solid black', padding: 5 },
    song: { fontFamily: 'Helvetica', fontSize: 15 },
  })

  return (
    <Document creator={undefined} producer={undefined} >
      <Page style={styles.page}>
        {props.setlist.sets.map((set, setIndex) => <View wrap={false} key={setIndex} style={styles.set}>
          <View >
            <Text style={styles.setTitle}>
              Set {setIndex + 1}
            </Text>
          </View>
          {set.map((song) => <View key={song.id} style={styles.setSong} >
            <Text style={styles.song}>
              {song.title}
            </Text>
          </View>
          )}
        </View>
        )}
        <View wrap={false} style={styles.set}>
          <View>
            <Text style={styles.setTitle}>
              Encore
            </Text>
          </View>
          {props.setlist.encore.map((song) => <View key={song.id} style={styles.setSong} >
            <Text style={styles.song}>
              {song.title}
            </Text>
          </View>)}
        </View>
      </Page>
    </Document>
  )
}

export default SetlistSinglePDF