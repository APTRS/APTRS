import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import * as api from "../lib/data/api"
import { Spinner } from "@material-tailwind/react"
export default function Logout() {
  const navigate = useNavigate()
  useEffect(() => {
    api.logout()
    setTimeout(() => {
      navigate('/')
    }, 1000)
  }, [])
  return (
      <><Spinner className="inline ml-1 -mt-1 h-4 w-4 text-center"/> Logging out... </>    
  )
}
