import type { song } from "./song"
import type { repertoire } from "./repertoire"

export type setlist = {
    concert: string
    sets: song[][]
    encore: song[]
    repertoire: repertoire
}