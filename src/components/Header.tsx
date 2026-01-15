import {
  Alignment,
  Button,
  Classes,
  Navbar,
  NavbarGroup,
  NavbarHeading,
} from '@blueprintjs/core'
import type React from 'react'

interface HeaderProps {
  isDark: boolean
  toggleDark: () => void
}

export const Header: React.FC<HeaderProps> = ({ isDark, toggleDark }) => {
  return (
    <Navbar className={isDark ? Classes.DARK : ''}>
      <NavbarGroup align={Alignment.START}>
        <NavbarHeading>招商银行账单转换器</NavbarHeading>
      </NavbarGroup>
      <NavbarGroup align={Alignment.END}>
        <Button
          className={Classes.MINIMAL}
          icon={isDark ? 'flash' : 'moon'}
          onClick={toggleDark}
          text={isDark ? '浅色模式' : '深色模式'}
        />
      </NavbarGroup>
    </Navbar>
  )
}
