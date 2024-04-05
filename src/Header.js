import './Header.css'

import React from "react"

export default function Header(props) {

  return (
    <div className='header'>
      <span style={{ width: 42, display: 'flex' }}>
        {props.leftButton}
      </span>
      <span className='title'>
        {props.title}
      </span>
      <span style={{ width: 42, display: 'flex' }}>
        {props.rightButton}
      </span>
    </div>
  )
}