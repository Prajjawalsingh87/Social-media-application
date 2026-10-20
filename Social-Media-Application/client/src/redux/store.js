import {configureStore} from '@reduxjs/toolkit'
import appConfigReducer from './slices/appConfigSlice'
import postsReducer from './slices/postsSlice'
import feedDataReducer from './slices/feedSlice'
import searchReducer from './slices/searchSlice'

export default configureStore({
    reducer: {
        appConfigReducer,
        postsReducer,
        feedDataReducer,
        searchReducer
    }
})