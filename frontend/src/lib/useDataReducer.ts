

import { parseErrors } from './utilities'
import { useReducer } from 'react'
import { FilteredSet } from './data/definitions';


export const DEFAULT_DATA_LIMIT = 20
export type DataMode = 'idle' | 'loading' | 'error';
export type DatasetState = {
/** A high-level description of the current state of the app
 * (e.g., if it's loading or encountered an error). */
mode: DataMode;
/** The current set of data results returned by the API. Rows only, not metadata */
data: any[]
/** The the current query params, Defaults to {offset:0, limit:DEFAULT_DATA_LIMIT}. */
queryParams: Record<string, any>;
/** Total rows in the data set, returned by API */
totalRows: number;
//Error - can be object or string, will try to format with parseErrors()
error?: any;
};
export type DatasetAction = 
| { type: 'set-mode'; payload: DataMode }
| { type: 'set-search'; payload: string }
| { type: 'set-filter'; payload: DatasetState["queryParams"] }
| { type: 'set-sort'; payload: {sort: string, order_by: '' | 'asc' | 'desc'}}
| { type: 'set-page'; payload: number }
| { type: 'set-rows-per-page'; payload: number }
| { type: 'set-error'; payload: any }
| { type: 'clear-search'}
| { type: 'set-data'; payload: { data: Partial<FilteredSet>} }
| { type: 'reset'}

//used by reducer functions in pages that have search and pagination
export const useDataReducer = (reducer: (state: DatasetState, action: DatasetAction) => DatasetState | void, initialState: DatasetState) => {
  const datasetHelper = (state: DatasetState, action: DatasetAction): DatasetState => {
    //first try the reducer that was passed in'
    if(reducer) {
      const result = reducer(state, action)
      if(result) return result
    }
    //if no reducer was passed in, use the default reducer    
    switch (action.type) {
      case 'set-filter': {
        console.log('useDataReducer - set-filter action received:', action.payload);
        
        // Create a copy of the current state's query parameters
        let newQueryParams = {...state.queryParams};
        
        // Track if we're processing date parameters
        let hasDateParams = false;
        
        // Copy the payload values to the new query parameters object
        Object.keys(action.payload).forEach(key => {
          if (action.payload[key] !== undefined) {
            newQueryParams[key] = action.payload[key];
            
            // Special logging for date fields
            if (key === 'startdate' || key === 'enddate_before') {
              console.log(`useDataReducer - Setting ${key} to:`, action.payload[key]);
              hasDateParams = true;
            }
          }
        });
        
        // Remove any empty values from the query parameters
        Object.keys(newQueryParams).forEach(key => {
          if (newQueryParams[key] === '' || newQueryParams[key] === null) {
            console.log(`useDataReducer - Removing empty parameter ${key}`);
            delete newQueryParams[key];
          }
        });
          // For date parameters, ensure they're in YYYY-MM-DD format
        // This is the format our backend expects and most compatible format
        if (hasDateParams) {
          if (newQueryParams.startdate && typeof newQueryParams.startdate === 'string') {
            try {
              if (newQueryParams.startdate.includes('T')) {
                // It's an ISO string, extract just the date part
                newQueryParams.startdate = newQueryParams.startdate.split('T')[0];
                console.log('useDataReducer - Extracted date from startdate ISO:', newQueryParams.startdate);
              } else if (!/^\d{4}-\d{2}-\d{2}$/.test(newQueryParams.startdate)) {
                // Not in YYYY-MM-DD format, need to convert
                const startDate = new Date(newQueryParams.startdate);
                if (!isNaN(startDate.getTime())) {
                  newQueryParams.startdate = startDate.toISOString().split('T')[0];
                  console.log('useDataReducer - Converted startdate to YYYY-MM-DD:', newQueryParams.startdate);
                }
              }
            } catch (e) {
              console.error('Failed to format startdate:', e);
            }
          }
          
          if (newQueryParams.enddate_before && typeof newQueryParams.enddate_before === 'string') {
            try {
              if (newQueryParams.enddate_before.includes('T')) {
                // It's an ISO string, extract just the date part
                newQueryParams.enddate_before = newQueryParams.enddate_before.split('T')[0];
                console.log('useDataReducer - Extracted date from enddate_before ISO:', newQueryParams.enddate_before);
              } else if (!/^\d{4}-\d{2}-\d{2}$/.test(newQueryParams.enddate_before)) {
                // Not in YYYY-MM-DD format, need to convert
                const endDate = new Date(newQueryParams.enddate_before);
                if (!isNaN(endDate.getTime())) {
                  newQueryParams.enddate_before = endDate.toISOString().split('T')[0];
                  console.log('useDataReducer - Converted enddate_before to YYYY-MM-DD:', newQueryParams.enddate_before);
                }
              }
            } catch (e) {
              console.error('Failed to format enddate_before:', e);
            }
          }
        }
          console.log('useDataReducer - Final query parameters:', newQueryParams);
        return {...state, queryParams: newQueryParams};
      }
      
      case 'set-sort': {
        let newQueryParams = {...state.queryParams, sort: action.payload.sort, order_by: action.payload.order_by}
        return {...state, queryParams: newQueryParams};
      }
      case 'reset': {
        const newQueryParams = {offset: 0, limit: state.queryParams?.limit || DEFAULT_DATA_LIMIT, sort: '', order_by: ''};
        return {...initialState, queryParams: newQueryParams};
      }
      case 'set-mode': {
        if(state.mode == action.payload){
          return state
        }
        return { ...state, mode: action.payload };
      }
      case 'set-data': {
        const { data } = action.payload;
        const totalRows = data.count
        return { ...state, data: data.results || [], totalRows: totalRows || 0, mode: 'idle' };
      }
      case 'set-rows-per-page': {
        if(state.queryParams.limit === action.payload){
          return state
        }
        let newQueryParams = {...state.queryParams, limit: action.payload}
        return {...state, queryParams: newQueryParams};
      }
      case 'set-page': {
        let newOffset = (action.payload-1) * state.queryParams.limit
        if(newOffset == state.queryParams.offset){
          return state
        }
        let newQueryParams = {...state.queryParams, offset: newOffset}
        return {...state, queryParams: newQueryParams};
      }
      case 'set-error': {
        return {...state, error: parseErrors(action.payload)};
      }
      case 'clear-search': {
        const newQueryParams = {offset: 0, limit: state.queryParams?.limit || DEFAULT_DATA_LIMIT, sort: '', order_by: ''};
        if(JSON.stringify(state.queryParams) == JSON.stringify(newQueryParams)){
          return state
        }
        return {...state, queryParams: newQueryParams};
      }
      default:
        throw new Error('Invalid action type: ' + action.type)
    }
  };
  return useReducer(datasetHelper, initialState);
}

