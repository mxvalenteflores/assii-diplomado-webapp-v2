import { useEffect, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { pb } from "../lib/pb"

export function ProtectedRoute() {
  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await pb.collection("admins").authRefresh()
        setValid(true)
      } catch {
        pb.authStore.clear()
        setValid(false)
      } finally {
        setChecking(false)
      }
    }
    if (pb.authStore.isValid) {
      checkAuth()
    } else {
      setChecking(false)
    }
  }, [])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Verificando sesión...
      </div>
    )
  }

  if (!valid) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
