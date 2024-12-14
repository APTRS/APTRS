
import{ ReactNode } from 'react'

export type Vulnerability = {
  id: number
  vulnerabilityname: string
  vulnerabilityseverity?: string
  vulnerabilitydescription?: string
  vulnerabilitysolution?: string
  vulnerabilityreferlnk?: string
  cvssscore?: number | string | null
  cvssvector?: string | null
  cwe?: string[];
}
export type ProjectVulnerability = Omit<Vulnerability, 'id'> & {
  id: number
  project: number | string
  POC: string
  instance:VulnerabilityInstance[]
  cwe?: string[];
}
export type VulnerabilityInstance =  { 
  id?: string | number | undefined
  URL: string
  Parameter?: string
  status: "Vulnerable" | "Confirm Fixed" | "Accepted Risk" | undefined
  error?: boolean
}
export type Props = {
  children: ReactNode
}

export type JsonResponse = {
  
}
export interface Project  {
  id?: number
  name: string
  status: string
  description: string
  projecttype: string
  startdate: string
  enddate: string
  testingtype: string
  projectexception: string
  companyname: string
  owner: string[]
}
export interface Company  {
  id?: number
  name?: string
  img?: string | File
  address?: string 
}

export interface Group  {
  id: number
  name: string
  description: string
  list_of_permissions: string[]
}

export interface Customer  {
  id?: number
  full_name?: string
  email?: string
  number?: string
  position?: string
  company?: string 
  is_active?: boolean
  password?: string
  password_check?: string
}

export type Scope = {
  id: number
  scope: string //url?
  description: string
}

export type Profile = {
  id: number
  profilepic: string
  number: string
  company: string
  user: number //user id
}

export type PermissionGroup = {
  id?: number
  name: string
  description: string
  list_of_permissions: string
}

//react data table types
export type Column = { //used for data tables
  name: string | JSX.Element
  selector: (row: any) => any
  sortable?: boolean
  maxWidth?: string
  omit?: boolean
}
export type User = {
  id?: number
  username?: string
  full_name?: string
  email?: string
  is_staff?: boolean
  is_active?: boolean
  is_superuser?: boolean
  profilepic?: File | string | undefined
  number?: string
  company?: string
  position?: string
  groups?: string[]
  location? : IPAddressInfo
  password?: string
  password_check?: string  
}
export interface CurrentUser extends User {
  isAdmin: boolean
  access: string
  refresh: string
  groups: string[]
}
export interface VulnWithActions extends Vulnerability {
  actions?: JSX.Element
  severity?:JSX.Element
  status?:string
}

export type IPAddressInfo = {
  ip: string
  network: string
  version: string
  city: string
  region: string
  region_code: string
  country: string
  country_name: string
  country_code: string
  country_code_iso3: string
  country_capital: string
  country_tld: string
  continent_code: string
  in_eu: boolean
  postal: string
  latitude: number
  longitude: number
  timezone: string
  utc_offset: string
  country_calling_code: string
  currency: string
  currency_name: string
  languages: string
  country_area: number
  country_population: number
  asn: string
  org: string
}
export type LoginUser = User & {
  refresh?: string
  access?: string
  Status?: string
  Pic?: string
  isAdmin?: boolean
  permissions?: string[]
}
export interface QueryParams{
  limit: number
  offset: number
}
export interface ProjectsQueryParams extends QueryParams {
  name?: string
  companyname?: string
  projecttype?: string
  testingtype?: string
  owner?: string
  status?: string
  startdate?: string
  enddate_before?: string
  [key: string]: string | number | undefined
}
export interface VulnQueryParams extends QueryParams {
  id?: number
  vulnerabilityname?: string
  vulnerabilityseverity?: string
  vulnerabilitydescription?: string
  vulnerabilitysolution?: string
  vulnerabilityreferlnk?: string
  cvssscore?: number
  cvssvector?: string 
  [key: string]: string | number | undefined
}
export interface FilteredSet {
  count: number
  next?: string
  previous?: string
  results: any[] 
}
export interface Permission {
  id: number
  name: string
  description: string
}
export interface ReportStandard {
  id: number
  name: string
}
export interface ProjectType {
  id: number
  name: string
}