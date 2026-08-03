import { Navigate } from "react-router-dom"
import { pb } from "../lib/pb"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!pb.authStore.isValid) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
