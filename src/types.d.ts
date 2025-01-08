declare module '*.jsx' {
    import { ReactElement } from 'react'
    const value: ReactElement
    export default value
  }
  
  declare module '*.js' {
    const value: any
    export default value
  }