import type { category } from './category'

export type property<T> = {
    type: category<T>;
    value: T
}