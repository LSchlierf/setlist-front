type song = {
  id: string;
  title: string;
  artist: string;
  length: number;
  notes: string;
  properties: { [key: string]: any };
};

const byTitle = (asc: boolean) => (songs?: song[] | undefined) => {
  return songs?.sort((s1, s2) => {
    if (s1.title === s2.title) {
      return 0;
    }
    return asc === (1 === s1.title.localeCompare(s2.title)) ? 1 : -1;
  });
};

const byArtist = (asc: boolean) => (songs?: song[] | undefined) => {
  return songs?.sort((s1, s2) => {
    if (s1.artist === s2.artist) {
      return 0;
    }
    return asc === (1 === s1.artist.localeCompare(s2.artist)) ? 1 : -1;
  });
};

const byLength = (asc: boolean) => (songs?: song[] | undefined) => {
  return songs?.sort((s1, s2) => {
    return asc ? s1.length - s2.length : s2.length - s1.length;
  });
};

const byCategory =
  (asc: boolean, categoryId: string, categoryType: string) =>
  (songs?: song[] | undefined) => {
    return songs?.sort((s1, s2) => {
      let p1, p2;
      switch (categoryType) {
        case "booleanCategory":
          p1 = Boolean(s1.properties[categoryId] || false);
          p2 = Boolean(s2.properties[categoryId] || false);
          return p1 === p2 ? 0 : p1 === asc ? 1 : -1;
        case "numberCategory":
          p1 = Number(s1.properties[categoryId] || 0);
          p2 = Number(s2.properties[categoryId] || 0);
          return asc ? p1 - p2 : p2 - p1;
        case "stringCategory":
          p1 = String(s1.properties[categoryId] || "");
          p2 = String(s2.properties[categoryId] || "");
          return asc ? p1.localeCompare(p2) : p2.localeCompare(p1);
        case "multipleStringCategory":
          p1 = String(s1.properties[categoryId]?.join(", ") || "");
          p2 = String(s2.properties[categoryId]?.join(", ") || "");
          return asc ? p1.localeCompare(p2) : p2.localeCompare(p1);
        default:
          return 0;
      }
    });
  };

export { byTitle, byArtist, byLength, byCategory };
