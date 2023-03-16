import { useContext, createContext } from "react"

export type State = {
  // The full schema
  // We might need to scope it with a JSON Pointer
  fullSchema: unknown
  // The current schema displayed (after the json pointer)
  userSchema: unknown
  // The current json pointer
  jsonPointer: string
}

export type Playground = {
  // state
  state: State
  // update function
  updateState: (_: Partial<State>) => void
}

export const PlaygroundContext = createContext<Playground>({
  state: {
    fullSchema: {},
    userSchema: {},
    jsonPointer: "",
  },
  updateState: () => {},
})

export const usePlaygroundContext = () => useContext(PlaygroundContext)

export const PlaygroundContextProvider = PlaygroundContext.Provider
