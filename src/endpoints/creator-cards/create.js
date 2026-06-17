'use strict';

const { createCreatorCard } = require('../../services/creator-cards/create');
const MESSAGES = require('../../messages/creator-cards');

async function createCreatorCardEndpoint(req, res, next) {
  try {
    const result = await createCreatorCard(req.body);

    if (result.validationError) {
      return res.status(400).json(result.validationError);
    }

    return res.status(200).json({
      status: 'success',
      message: MESSAGES.CREATE_SUCCESS,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = createCreatorCardEndpoint;
