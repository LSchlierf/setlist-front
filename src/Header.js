import './Header.css'

import React from "react"

export default function Header(props) {

  return (
    <div className='header'>
      <div className='header-buttons'>
        <span style={{ display: 'flex' }}>
          {props.leftButton}
        </span>
        <span style={{ display: 'flex' }}>
          {props.rightButton}
        </span>
      </div>
      <span className='title'>
        {props.title}
      </span>
    </div>
  )
}