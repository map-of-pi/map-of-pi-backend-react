import { Router } from 'express';

import * as imageController from '../../controllers/misc/imageController';
import multerService from '../../services/misc/multer.service';

const imageRoutes = Router();

imageRoutes.get('/images', imageController.getImage);

imageRoutes.post('/images/upload', multerService.single('image'), imageController.uploadImage);

export default imageRoutes;