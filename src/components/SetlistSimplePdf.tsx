import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type SetlistSimplePDFProps = {
  concert: string;
  sets: { title: string; id: string }[][];
  encore: { title: string; id: string }[];
};

export default function SetlistSimplePDF({
  concert,
  sets,
  encore,
}: SetlistSimplePDFProps) {
  const styles = StyleSheet.create({
    page: {
      padding: 40,
      display: "flex",
      flexDirection: "column",
      flexWrap: "wrap",
      maxHeight: "100vh",
    },
    set: { padding: 17, width: "50%" },
    setTitle: { fontWeight: 700, fontSize: 20, fontFamily: "Helvetica-Bold" },
    setSong: { borderTop: "2px solid black", padding: 5 },
    song: { fontFamily: "Helvetica", fontSize: 15 },
  });

  const rowsPerColumn = 25;

  function makeSetPages() {
    let rowsThisColumn = 0;
    let columsThisPage = 0;

    let pages = [[]] as any[][];

    const encoreViews = [
      <View key="encoreTitle">
        <Text style={styles.setTitle}>Encore</Text>
      </View>,
    ].concat(
      encore.map((song) => (
        <View key={song.id} style={styles.setSong}>
          <Text style={styles.song}>{song.title}</Text>
        </View>
      ))
    );

    let setViews = sets
      .map((set, i) =>
        [
          <View key={`SetTitle-${i}`}>
            <Text style={styles.setTitle}>Set {i + 1}</Text>
          </View>,
        ].concat(
          set.map((song) => (
            <View key={song.id} style={styles.setSong}>
              <Text style={styles.song}>{song.title}</Text>
            </View>
          ))
        )
      )
      .concat([encoreViews]);

    while (setViews.length > 0) {
      let set = setViews.shift()!;
      let setStarted = false;

      while (
        set.length > rowsPerColumn ||
        (setStarted && set.length > rowsPerColumn - rowsThisColumn - 1)
      ) {
        let part = set.slice(
          0,
          rowsPerColumn - rowsThisColumn - (setStarted ? 1 : 0)
        );
        set = set.slice(rowsPerColumn - rowsThisColumn - (setStarted ? 1 : 0));

        pages[pages.length - 1].push(
          <View
            key={`settitle-${pages.length}-${columsThisPage}-${rowsThisColumn}`}
            style={styles.set}
          >
            {setStarted ? (
              <View>
                <Text style={styles.setTitle}> </Text>
              </View>
            ) : (
              <></>
            )}
            {part}
          </View>
        );

        setStarted = true;
        columsThisPage++;
        rowsThisColumn = 0;

        if (columsThisPage === 2) {
          columsThisPage = 0;
          pages.push([]);
        }
      }

      if (!setStarted && set.length > rowsPerColumn - rowsThisColumn) {
        columsThisPage++;
        rowsThisColumn = 0;

        if (columsThisPage === 2) {
          columsThisPage = 0;
          pages.push([]);
        }
      }

      if (set.length > 0) {
        pages[pages.length - 1].push(
          <View
            key={`settitle-${pages.length}-${columsThisPage}-${rowsThisColumn}`}
            style={styles.set}
          >
            {setStarted ? (
              <View>
                <Text style={styles.setTitle}> </Text>
              </View>
            ) : (
              <></>
            )}
            {set}
          </View>
        );

        rowsThisColumn += set.length + 1 + (setStarted ? 1 : 0);
        if (rowsThisColumn >= rowsPerColumn) {
          rowsThisColumn = 0;
          columsThisPage++;
        }

        if (columsThisPage === 2) {
          columsThisPage = 0;
          rowsThisColumn = 0;
          pages.push([]);
        }
      }
    }

    if (pages[pages.length - 1].length === 0) {
      delete pages[pages.length - 1];
    }

    return pages;
  }

  return (
    <Document
      title={"Setlist " + concert}
      creator={undefined}
      producer={undefined}
    >
      {makeSetPages().map((p) => (
        <Page style={styles.page}>{p}</Page>
      ))}
    </Document>
  );
}
