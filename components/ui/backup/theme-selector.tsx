"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Palette, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="h-9 w-9 rounded-md bg-background text-foreground border border-input inline-flex items-center justify-center"
          aria-label="Select theme"
        >
          <Palette className="h-4 w-4" />
          <span className="sr-only">Select theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="flex items-center justify-between"
        >
          Light
          {theme === "light" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="flex items-center justify-between"
        >
          Dark
          {theme === "dark" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => setTheme("slate")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full theme-slate" />
            <span>Slate</span>
          </div>
          {theme === "slate" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("zinc")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full theme-zinc" />
            <span>Zinc</span>
          </div>
          {theme === "zinc" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("stone")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full theme-stone" />
            <span>Stone</span>
          </div>
          {theme === "stone" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("gray")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full theme-gray" />
            <span>Gray</span>
          </div>
          {theme === "gray" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("red")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full theme-red" />
            <span>Red</span>
          </div>
          {theme === "red" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("rose")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full theme-rose" />
            <span>Rose</span>
          </div>
          {theme === "rose" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("orange")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full theme-orange" />
            <span>Orange</span>
          </div>
          {theme === "orange" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("green")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full theme-green" />
            <span>Green</span>
          </div>
          {theme === "green" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("blue")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full theme-blue" />
            <span>Blue</span>
          </div>
          {theme === "blue" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("violet")}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full theme-violet" />
            <span>Violet</span>
          </div>
          {theme === "violet" && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
