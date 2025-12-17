const express = require('express')
const router = express.Router()
const verifyUser = require('../middleware/verifyUser')
import { getCountries, getUniversitiesByCountry, matchSubjects } from '../controllers/process/subjectChoiceControllers';

router.get('/countries',
    verifyUser, 
    getCountries);
router.get('/universities', 
    verifyUser,
    getUniversitiesByCountry);
router.post('/subjects/match',
    verifyUser,
    matchSubjects);

export const subjectChoiceModels = router