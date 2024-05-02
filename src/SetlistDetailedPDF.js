import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import React from "react";

function SetlistDetailedPDF(props) {
  const sets = props.setlist?.sets || []
  const encore = props.setlist?.encore || []
  const breakLength = props.setlist?.breaks?.len || 0
  const bufferLength = props.setlist?.breaks?.buffer || 0
  const startTime = props.setlist?.startTime || '19:30'
  const concert = props.setlist?.concert || ''
  const categories = props.repertoire?.categories?.filter((c) => c.type !== 'bool') || []
  const catsBool = props.repertoire?.categories?.filter((c) => c.type === 'bool') || []

  const titleWidth = 18
  const boolWidth = 15
  const notesWidth = 28
  const timeWidth = 4.5

  const remainingWidth = 100 - titleWidth - boolWidth - notesWidth - timeWidth

  const catWidth = remainingWidth / categories.length

  const fontSizeHeader = 14
  const fontSizeFields = 12
  const fontSizeTime = 10
  const fontSizeSetTime = 25

  let songStarts = []

  let lastEnd = nextTime(startTime, 0)

  for (let set in sets) {
    let thisSetStarts = []
    for (let song in sets[set]) {
      thisSetStarts.push(lastEnd)
      lastEnd = nextTime(lastEnd, sets[set][song].length)
    }
    thisSetStarts.push(nextRounded(nextTime(lastEnd, (bufferLength * 60))))
    if (set < sets.length - 1) {
      lastEnd = nextRounded(nextTime(lastEnd, (breakLength * 60) + (bufferLength * 60)))
    } else {
      lastEnd = nextRounded(nextTime(lastEnd, (bufferLength * 60)))
    }
    songStarts.push(thisSetStarts) // round to next 5 min interval
  }

  console.log(songStarts)

  let encoreStarts = []
  for (let song in encore) {
    encoreStarts.push(lastEnd)
    lastEnd = nextTime(lastEnd, encore[song].length)
  }
  songStarts.push(encoreStarts)

  function setTime(set) {
    return set.reduce((a, s) => a + s.length, 0)
  }

  function setTimeRounded(set) {
    return Math.ceil(set.reduce((a, s) => a + s.length, 0) / 60 / 5) * 60 * 5
  }

  function nextTime(time, duration) {
    const h = Number(time.split(':')[0])
    const m = Number(time.split(':')[1])
    const s = Number(time.split(':')[2] || 0)

    const start = (h * 3600) + (m * 60) + s
    const end = (start + duration) % 86400

    return ('0' + Math.floor(end / 3600)).slice(-2) + ':' + ('0' + (Math.floor(end / 60) % 60)).slice(-2) + ':' + ('0' + (end % 60)).slice(-2)
  }

  function nextRounded(time) {
    const h = Number(time.split(':')[0])
    const m = Number(time.split(':')[1])
    const s = Number(time.split(':')[2] || 0)

    const start = (h * 3600) + (m * 60) + s
    const end = Math.ceil(start / 60 / 5) * 60 * 5

    return ('0' + Math.floor(end / 3600)).slice(-2) + ':' + ('0' + (Math.floor(end / 60) % 60)).slice(-2) + ':' + ('0' + (end % 60)).slice(-2)
  }

  function nextTimeNoSecs(time, duration) {
    return nextTime(time, duration).substring(0, 5)
  }

  const styles = StyleSheet.create({
    page: { padding: 25 },
    flexRow: { display: 'flex', flexDirection: 'row' },
    column: { width: '100%', display: 'flex', flexDirection: 'column' },
    values: { width: '92%', display: 'flex', flexDirection: 'row' },
    width100: { width: '100%' },
    height100: { height: '100%' },
    heightMin: { height: 40 },
    timeBlock: { width: '8%', height: '100%' },
    breakLine: { backgroundColor: 'lightgray', borderBottom: '1px solid black', borderTop: '1px solid black' },
    headerTextBold: { fontFamily: 'Helvetica-Bold', fontSize: fontSizeHeader },
    headerTextNotBold: { fontFamily: 'Helvetica', fontSize: fontSizeHeader },
    text: { fontFamily: 'Helvetica', fontSize: fontSizeFields },
    textBold: { fontFamily: 'Helvetica-Bold', fontSize: fontSizeFields },
    textTime: { fontFamily: 'Helvetica', fontSize: fontSizeTime },
    textTimeBlock: { fontFamily: 'Helvetica', fontSize: fontSizeFields },
    textSetTimeBlock: { fontFamily: 'Helvetica', fontSize: fontSizeSetTime },
    rotate90: { transform: 'rotate(90deg)' },
    justifyEnd: { justifyContent: 'flex-end' },
    justifyCenter: { justifyContent: 'center' },
    paddingBottom: { paddingBottom: 15 },
    alignCenter: { alignItems: 'center' },
    cell: { border: '1px solid black', padding: 1 },
    invisCell: { borderRight: '1px solid black', padding: 1 },
    title: { width: titleWidth + '%' },
    notes: { width: notesWidth + '%' },
    bool: { width: boolWidth + '%' },
    time: { width: timeWidth + '%' },
    cat: { width: catWidth + '%' },
  })

  function header() {
    return (
      <View style={[styles.flexRow, styles.width100]} key={'header'}>
        <View style={styles.values} >
          <View style={[styles.cell, styles.title]}>
            <Text style={styles.headerTextBold}>
              {concert}
            </Text>
          </View>
          {categories.map((c) => (
            <View style={[styles.cell, styles.cat]} key={c.id}>
              <Text style={styles.headerTextBold}>
                {c.title}
              </Text>
            </View>
          ))}
          <View style={[styles.cell, styles.bool]}>
            <Text style={styles.headerTextBold}>
              Hints
            </Text>
          </View>
          <View style={[styles.cell, styles.notes]}>
            <Text style={styles.headerTextBold}>
              Notes
            </Text>
          </View>
          <View style={[styles.cell, styles.time]}>
            <Text style={styles.headerTextBold}>
              Start
            </Text>
          </View>
        </View>
        <View style={[styles.cell, styles.timeBlock, styles.flexRow, styles.justifyCenter]}>
          <Text style={styles.headerTextNotBold}>
            {startTime}
          </Text>
        </View>
      </View>
    )
  }

  function songRow(song, songIndex, setIndex) {
    return (
      <View key={song.id} style={[styles.flexRow, styles.width100]}>
        <View style={[styles.cell, styles.title]}>
          <Text style={styles.textBold}>
            {song.title}
          </Text>
        </View>
        {categories.map((c) => (
          <View style={[styles.cell, styles.cat]} key={c.id}>
            <Text style={styles.text}>
              {
                function () {
                  switch (c.type) {
                    case 'string':
                    case 'number':
                      return song.properties?.[c.id]
                    case 'stringMultiple':
                      return song.properties?.[c.id]?.join(', ')
                    default:
                      return 'not implemented'
                  }
                }()
              }
            </Text>
          </View>
        ))}
        <View style={[styles.cell, styles.bool]}>
          <Text style={styles.text}>
            {[song.notes, ...catsBool.map((c) => (song.properties && song.properties[c.id] === true) ? c.title : undefined)].filter((p) => p !== undefined).join(', ')}
          </Text>
        </View>
        <View style={[styles.cell, styles.notes]} />
        <View style={[styles.cell, styles.time, styles.flexRow, styles.justifyEnd]}>
          <Text style={styles.textTime}>
            {songStarts[setIndex][songIndex]}
          </Text>
        </View>
      </View>
    )
  }

  function setBlock(set, setIndex) {
    return (
      <View key={setIndex} wrap={false}>
        <View style={[styles.flexRow, styles.width100, styles.setBlock]}>
          <View style={styles.values}>
            <View style={styles.column}>
              {set.map((song, songIndex) => songRow(song, songIndex, setIndex))}
            </View>
          </View>
          <View style={[styles.cell, styles.timeBlock, styles.flexRow]}>
            <View style={[styles.column, styles.alignCenter, styles.justifyCenter, styles.width100, styles.height100]}>
              <Text wrap={false} style={[styles.textSetTimeBlock]}>
                {nextTimeNoSecs(songStarts[setIndex][0], 0)}
              </Text>
              <Text wrap={false} style={[styles.textSetTimeBlock]}>
                {'-'}
              </Text>
              <Text wrap={false} style={[styles.textSetTimeBlock]}>
                {nextTimeNoSecs(songStarts[setIndex][set.length], 0)}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.flexRow, styles.width100]}>
          <View style={[styles.values, styles.breakLine, styles.justifyEnd]}>
            <View style={[styles.invisCell, styles.time, styles.flexRow, styles.justifyEnd]}>
              <Text style={[styles.textTime]}>
                {songStarts[setIndex][set.length]}
              </Text>
            </View>
          </View>
          <View style={[styles.timeBlock, styles.flexRow, styles.justifyCenter, styles.cell]}>
            <Text style={styles.textTime}>
              {setIndex === sets.length - 1 ? '' : breakLength + ' min break'}
            </Text>
          </View>
        </View>
      </View >
    )
  }

  function encoreBlock() {
    return (
      <View key={'encoreBlock'} style={[styles.flexRow, styles.width100, styles.setBlock, styles.paddingBottom]}>
        <View style={styles.values}>
          <View style={styles.column}>
            {encore.map((song, songIndex) => songRow(song, songIndex, sets.length))}
          </View>
        </View>
        <View style={[styles.cell, styles.timeBlock, styles.flexRow]}>
          <View style={[styles.flexRow, styles.width100, styles.height100, styles.justifyCenter, styles.alignCenter]}>
            <Text style={styles.textTimeBlock}>
              {setTimeRounded(encore) / 60} min
            </Text>
          </View>
        </View>
      </View>
    )
  }

  function infoFooter() {
    return (
      <View key={'infoFooter'}>
        <View style={[styles.flexRow, styles.width100]} >
          <View style={[styles.values, styles.flexRow, styles.justifyEnd]}>
            <View style={[styles.flexRow, styles.justifyEnd]}>
              <Text style={styles.textTime}>
                Duration sets:
              </Text>
            </View>
            <View style={[styles.time, styles.flexRow, styles.justifyEnd]}>
              <Text style={styles.textTime}>
                {nextTime('00:00', [...sets, encore].map(s => setTimeRounded(s) + (bufferLength * 60)).reduce((a, b) => a + b, 0) - (bufferLength * 60))}
              </Text>
            </View>
          </View>
          <View style={[styles.timeBlock]}></View>
        </View>
        <View style={[styles.flexRow, styles.width100]} >
          <View style={[styles.values, styles.flexRow, styles.justifyEnd]}>
            <View style={[styles.flexRow, styles.justifyEnd]}>
              <Text style={styles.textTime}>
                Duration breaks:
              </Text>
            </View>
            <View style={[styles.time, styles.flexRow, styles.justifyEnd]}>
              <Text style={styles.textTime}>
                {nextTime('00:00', setTime([{ length: ((sets.length - 1) * breakLength * 60) }]))}
              </Text>
            </View>
          </View>
          <View style={[styles.timeBlock, styles.flexRow, styles.justifyCenter]}>
            <Text style={styles.textTime}>
              Start: {nextTime(startTime, 0)}
            </Text>
          </View>
        </View>
        <View style={[styles.flexRow, styles.width100]} >
          <View style={[styles.values, styles.flexRow, styles.justifyEnd]}>
            <View style={[styles.flexRow, styles.justifyEnd]}>
              <Text style={styles.textTime}>
                Duration total:
              </Text>
            </View>
            <View style={[styles.time, styles.flexRow, styles.justifyEnd]}>
              <Text style={styles.textTime}>
                {nextTime('00:00', [...sets, encore].map(s => setTimeRounded(s) + (bufferLength * 60)).reduce((a, b) => a + b, 0) - (bufferLength * 60) + setTime([{ length: ((sets.length - 1) * breakLength * 60) }]))}
              </Text>
            </View>
          </View>
          <View style={[styles.timeBlock, styles.flexRow, styles.justifyCenter]}>
            <Text style={styles.textTime}>
              End: {nextTime(startTime, [...sets, encore].map(s => setTimeRounded(s) + (bufferLength * 60)).reduce((a, b) => a + b, 0) - (bufferLength * 60) + setTime([{ length: ((sets.length - 1) * breakLength * 60) }]))}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <Document creator={undefined} producer={undefined} >
      <Page size='A3' orientation='landscape' style={styles.page}>
        {header()}
        {sets.map(setBlock)}
        {encoreBlock()}
        {infoFooter()}
      </Page>
    </Document>
  )
}

export default SetlistDetailedPDF