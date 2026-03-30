"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown"
import clsx from "clsx"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9" /> // placeholder to prevent layout shift
  }

  return (
    <Dropdown
      align="right"
      side="bottom"
      trigger={
        <button className="relative flex items-center justify-center p-2 rounded-md hover:bg-white/5 dark:hover:bg-white/10 transition-colors border border-transparent text-muted-foreground hover:text-foreground">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>
      }
    >
      <div className="py-1 px-1 flex flex-col gap-0.5">
        <DropdownItem 
          onClick={() => setTheme("light")} 
          className={clsx(theme === 'light' && "bg-black/5 dark:bg-white/10")}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownItem>
        <DropdownItem 
          onClick={() => setTheme("dark")} 
          className={clsx(theme === 'dark' && "bg-black/5 dark:bg-white/10")}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownItem>
        <DropdownItem 
          onClick={() => setTheme("system")} 
          className={clsx(theme === 'system' && "bg-black/5 dark:bg-white/10")}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownItem>
      </div>
    </Dropdown>
  )
}
