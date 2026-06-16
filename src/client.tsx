import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import { AppProviders } from '@/lib/theme-provider'
import './styles.css'

const rootEl = document.getElementById('root')
if (rootEl) {
  const router = getRouter()
  createRoot(rootEl).render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(
        AppProviders,
        null,
        React.createElement(RouterProvider, { router })
      )
    )
  )
}
