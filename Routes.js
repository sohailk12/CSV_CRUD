import express from "express";

import {addData, deleteData, deleteMultiple, readData, updateData} from './Controller.js';

const router = express.Router();

router.post('/create',addData);

router.get('/read',readData);

router.put('/update',updateData);

router.delete('/delete/:id',deleteData);

router.delete('/delete', deleteMultiple);

export default router;
