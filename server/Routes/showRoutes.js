import express from 'express'
import { addShow, getNowPlayingMovies, getShow, getShows } from '../Controllers/ShowController.js'
import { protectAdmin } from '../middleware/auth.js'

const showRouter = express.Router()

showRouter.get('/now-playing',protectAdmin, getNowPlayingMovies)
showRouter.post('/add',protectAdmin, addShow)
showRouter.get('/all', getShows)
showRouter.get('/movie/:movieId', getShow) // Changed to avoid conflict

export default showRouter;
