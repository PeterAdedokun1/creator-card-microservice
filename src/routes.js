'use strict';

const express = require('express');
const router = express.Router();

const createEndpoint = require('./endpoints/creator-cards/create');
const retrieveEndpoint = require('./endpoints/creator-cards/retrieve');
const deleteEndpoint = require('./endpoints/creator-cards/delete');

router.post('/creator-cards', createEndpoint);
router.get('/creator-cards/:slug', retrieveEndpoint);
router.delete('/creator-cards/:slug', deleteEndpoint);

module.exports = router;
