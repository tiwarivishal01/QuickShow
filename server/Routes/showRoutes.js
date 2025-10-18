import express from 'express'
import { getNowPlayingMovies } from '../Controllers/ShowController.js'

const showRouter = express.Router()

showRouter.get('/now-playing', getNowPlayingMovies)
// showRouter.post('/add',addShow)


export default showRouter;
  