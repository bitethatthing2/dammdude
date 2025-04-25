"use client"

import { useTheme } from "next-themes"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()
  const { theme, resolvedTheme } = useTheme()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Get the current theme value, and add the theme class to the toast
        const currentTheme = theme?.includes("-") 
          ? theme?.split("-")[0] || "slate" 
          : "slate"
        
        // Add theme-specific class to the toast
        const themeClass = `theme-toast theme-${currentTheme}`

        return (
          <Toast key={id} {...props} className={`${props.className || ""} ${themeClass}`}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}