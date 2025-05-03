import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import * as api from "../lib/data/api"
import { Spinner } from "@material-tailwind/react"

// Ensure proper type casting for Material Tailwind components
const SpinnerComponent = Spinner as unknown as React.FC<React.HTMLAttributes<HTMLDivElement>>;

export default function Logout() {
  const navigate = useNavigate()
  useEffect(() => {
    api.logout()
    setTimeout(() => {
      navigate('/')
    }, 1000)
  }, [])
  return (
      <><SpinnerComponent className="inline ml-1 -mt-1 h-4 w-4 text-center" /> Logging out... </>    
  )
}
